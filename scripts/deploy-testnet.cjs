const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  rpc,
  Networks,
  Keypair,
  Operation,
  TransactionBuilder,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
} = require('@stellar/stellar-sdk');

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

const CONTRACTS = [
  {
    key: 'designer_registry',
    name: 'DesignerRegistry',
    wasmFile: 'stellar_threads_designer_registry.wasm',
  },
  {
    key: 'product_passport',
    name: 'ProductPassport',
    wasmFile: 'stellar_threads_product_passport.wasm',
  },
  {
    key: 'fashion_escrow',
    name: 'FashionEscrow',
    wasmFile: 'stellar_threads_fashion_escrow.wasm',
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForTx(server, hash, maxAttempts = 35) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await server.getTransaction(hash);
    if (res.status === 'SUCCESS') {
      return res;
    }
    if (res.status === 'FAILED') {
      throw new Error(`Transaction ${hash} failed: ${JSON.stringify(res)}`);
    }
    await sleep(2500);
  }
  throw new Error(`Transaction ${hash} timed out after ${maxAttempts} attempts`);
}

async function fundAccount(publicKey) {
  console.log(`Funding deployer ${publicKey} via Friendbot...`);
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        console.log('✓ Account funded successfully!');
        return;
      }
      const text = await res.text();
      console.warn(`Friendbot attempt ${attempt} response: ${text}. Retrying in 3s...`);
    } catch (err) {
      console.warn(`Friendbot attempt ${attempt} error: ${err.message}. Retrying in 3s...`);
    }
    await sleep(3000);
  }
  throw new Error('Failed to fund account after 10 attempts');
}

async function checkWasmInstalled(server, wasmHashHex) {
  try {
    const wasmHash = Buffer.from(wasmHashHex, 'hex');
    const key = xdr.LedgerKey.contractCode(new xdr.LedgerKeyContractCode({ hash: wasmHash }));
    const res = await server.getLedgerEntries(key);
    return Boolean(res && res.entries && res.entries.length > 0);
  } catch {
    return false;
  }
}

async function main() {
  console.log('======================================================');
  console.log('  STELLAR THREADS — SOROBAN SMART CONTRACT DEPLOYMENT  ');
  console.log('======================================================');
  console.log(`RPC Endpoint: ${RPC_URL}`);
  console.log(`Network: Stellar Testnet\n`);

  const server = new rpc.Server(RPC_URL);

  // Setup Deployer Keypair
  let deployer;
  const deployerPath = path.resolve(__dirname, '..', '.deployer.json');
  if (process.env.STELLAR_DEPLOYER_SECRET) {
    deployer = Keypair.fromSecret(process.env.STELLAR_DEPLOYER_SECRET);
    console.log(`Using deployer from env: ${deployer.publicKey()}`);
  } else if (fs.existsSync(deployerPath)) {
    const saved = JSON.parse(fs.readFileSync(deployerPath, 'utf8'));
    deployer = Keypair.fromSecret(saved.secret);
    console.log(`Loaded saved deployer: ${deployer.publicKey()}`);
  } else {
    deployer = Keypair.random();
    fs.writeFileSync(
      deployerPath,
      JSON.stringify({ publicKey: deployer.publicKey(), secret: deployer.secret() }, null, 2)
    );
    console.log(`Generated new deployer: ${deployer.publicKey()} (saved to .deployer.json)`);
  }

  // Ensure Deployer has funds
  try {
    await server.getAccount(deployer.publicKey());
    console.log('Deployer account is active on Testnet.');
  } catch {
    await fundAccount(deployer.publicKey());
    await sleep(4000);
  }

  const wasmBaseDir = path.resolve(
    __dirname,
    '..',
    'contracts',
    'target',
    'wasm32-unknown-unknown',
    'release'
  );

  const manifestPath = path.resolve(__dirname, '..', 'deployments', 'testnet.json');
  let existingManifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {}
  }

  const deploymentResults = {
    network: 'testnet',
    networkPassphrase: PASSPHRASE,
    rpcUrl: RPC_URL,
    deployerPublicKey: deployer.publicKey(),
    deployedAt: new Date().toISOString(),
    contracts: {},
  };

  for (const contractSpec of CONTRACTS) {
    console.log(`\n>>> Processing ${contractSpec.name} (${contractSpec.key}) <<<`);
    const wasmPath = path.join(wasmBaseDir, contractSpec.wasmFile);
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found at ${wasmPath}. Run 'node scripts/build-contracts.cjs' first.`);
    }

    const wasmBytes = fs.readFileSync(wasmPath);
    const wasmHashHex = crypto.createHash('sha256').update(wasmBytes).digest('hex');
    console.log(`WASM size: ${wasmBytes.length} bytes, SHA-256: ${wasmHashHex}`);

    let uploadTxHash = existingManifest.contracts?.[contractSpec.key]?.uploadTxHash || null;
    let contractAddress = existingManifest.contracts?.[contractSpec.key]?.address || null;
    let deploymentTxHash = existingManifest.contracts?.[contractSpec.key]?.deploymentTxHash || null;

    // Check if contract already exists and is callable
    let isReused = false;
    if (contractAddress) {
      try {
        console.log(`Testing existing contract at ${contractAddress}...`);
        const testAccount = await server.getAccount(deployer.publicKey());
        const simTx = new TransactionBuilder(testAccount, { fee: '100', networkPassphrase: PASSPHRASE })
          .addOperation(
            Operation.invokeContractFunction({
              contract: contractAddress,
              function: contractSpec.key === 'designer_registry' ? 'has_designer' : (contractSpec.key === 'product_passport' ? 'get_passport' : 'has_order'),
              args: contractSpec.key === 'designer_registry' ? [new Address(deployer.publicKey()).toScVal()] : (contractSpec.key === 'product_passport' ? [nativeToScVal('TEST', { type: 'string' })] : [nativeToScVal(1n, { type: 'u64' })]),
            })
          )
          .setTimeout(60)
          .build();
        const simRes = await server.simulateTransaction(simTx);
        if (!simRes.error) {
          console.log(`✓ Existing contract ${contractAddress} is verified active on Testnet!`);
          isReused = true;
        }
      } catch (e) {
        console.log(`Existing contract check failed (${e.message}), redeploying...`);
        contractAddress = null;
      }
    }

    if (!isReused || !contractAddress) {
      // 1. Upload WASM if not installed
      console.log('Checking WASM installation on Testnet...');
      const installed = await checkWasmInstalled(server, wasmHashHex);
      if (!installed) {
        console.log('Uploading WASM to Testnet...');
        let account = await server.getAccount(deployer.publicKey());
        const uploadTx = new TransactionBuilder(account, { fee: '100', networkPassphrase: PASSPHRASE })
          .addOperation(Operation.uploadContractWasm({ wasm: wasmBytes }))
          .setTimeout(60)
          .build();
        const preparedUpload = await server.prepareTransaction(uploadTx);
        preparedUpload.sign(deployer);
        const uploadSend = await server.sendTransaction(preparedUpload);
        if (uploadSend.status === 'ERROR') {
          throw new Error(`Upload transaction failed to send: ${JSON.stringify(uploadSend)}`);
        }
        console.log(`Upload tx submitted: ${uploadSend.hash}. Waiting for confirmation...`);
        await waitForTx(server, uploadSend.hash);
        uploadTxHash = uploadSend.hash;
        console.log(`✓ WASM uploaded successfully: ${uploadTxHash}`);
      } else {
        console.log(`✓ WASM is already installed on-chain.`);
      }

      // 2. Deploy Contract Instance
      console.log('Deploying contract instance...');
      let account = await server.getAccount(deployer.publicKey());
      const salt = crypto.randomBytes(32);
      const deployTx = new TransactionBuilder(account, { fee: '100', networkPassphrase: PASSPHRASE })
        .addOperation(
          Operation.createCustomContract({
            address: Address.fromString(deployer.publicKey()),
            wasmHash: Buffer.from(wasmHashHex, 'hex'),
            salt,
          })
        )
        .setTimeout(60)
        .build();

      const preparedDeploy = await server.prepareTransaction(deployTx);
      preparedDeploy.sign(deployer);
      const deploySend = await server.sendTransaction(preparedDeploy);
      if (deploySend.status === 'ERROR') {
        throw new Error(`Deploy transaction failed to send: ${JSON.stringify(deploySend)}`);
      }
      console.log(`Deployment tx submitted: ${deploySend.hash}. Waiting for confirmation...`);
      const deployRes = await waitForTx(server, deploySend.hash);
      contractAddress = Address.fromScVal(deployRes.returnValue).toString();
      deploymentTxHash = deploySend.hash;
      console.log(`✓ Contract deployed at: ${contractAddress}`);
    }

    deploymentResults.contracts[contractSpec.key] = {
      name: contractSpec.name,
      address: contractAddress,
      wasmHash: wasmHashHex,
      uploadTxHash,
      deploymentTxHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/contract/${contractAddress}`,
    };
  }

  // 3. Verification & Initial Seed Transactions
  console.log('\n======================================================');
  console.log('  RUNNING INITIAL ON-CHAIN PROTOCOL SEED TRANSACTIONS ');
  console.log('======================================================');

  const designerContract = deploymentResults.contracts.designer_registry.address;
  const passportContract = deploymentResults.contracts.product_passport.address;
  const escrowContract = deploymentResults.contracts.fashion_escrow.address;

  // Seed 1: Register Deployer as genesis Designer if not already registered
  try {
    let account = await server.getAccount(deployer.publicKey());
    const hasSimTx = new TransactionBuilder(account, { fee: '100', networkPassphrase: PASSPHRASE })
      .addOperation(
        Operation.invokeContractFunction({
          contract: designerContract,
          function: 'has_designer',
          args: [new Address(deployer.publicKey()).toScVal()],
        })
      )
      .setTimeout(60)
      .build();
    const simRes = await server.simulateTransaction(hasSimTx);
    const isRegistered = scValToNative(simRes.result.retval);
    if (!isRegistered) {
      console.log('Registering genesis designer atelier on-chain...');
      account = await server.getAccount(deployer.publicKey());
      const regTx = new TransactionBuilder(account, { fee: '100', networkPassphrase: PASSPHRASE })
        .addOperation(
          Operation.invokeContractFunction({
            contract: designerContract,
            function: 'register_designer',
            args: [
              new Address(deployer.publicKey()).toScVal(),
              nativeToScVal('Atelier Stellar Threads', { type: 'string' }),
              nativeToScVal('London & Paris', { type: 'string' }),
              nativeToScVal('ipfs://bafybeiatelierstellarthreads001', { type: 'string' }),
            ],
          })
        )
        .setTimeout(60)
        .build();
      const preparedReg = await server.prepareTransaction(regTx);
      preparedReg.sign(deployer);
      const regSend = await server.sendTransaction(preparedReg);
      const regRes = await waitForTx(server, regSend.hash);
      console.log(`✓ Genesis Designer registered! Tx: ${regSend.hash}`);
      deploymentResults.contracts.designer_registry.seedTxHash = regSend.hash;
    } else {
      console.log('Deployer is already registered as a designer on-chain.');
    }
  } catch (err) {
    console.warn(`Genesis designer registration notice: ${err.message}`);
  }

  // Seed 2: Register initial digital product passport
  try {
    const samplePassportId = 'ST-GENESIS-001';
    let account = await server.getAccount(deployer.publicKey());
    const getPassSim = new TransactionBuilder(account, { fee: '100', networkPassphrase: PASSPHRASE })
      .addOperation(
        Operation.invokeContractFunction({
          contract: passportContract,
          function: 'get_passport',
          args: [nativeToScVal(samplePassportId, { type: 'string' })],
        })
      )
      .setTimeout(60)
      .build();
    const simRes = await server.simulateTransaction(getPassSim);
    if (simRes.error) {
      console.log('Minting genesis digital product passport on-chain...');
      account = await server.getAccount(deployer.publicKey());
      const passTx = new TransactionBuilder(account, { fee: '100', networkPassphrase: PASSPHRASE })
        .addOperation(
          Operation.invokeContractFunction({
            contract: passportContract,
            function: 'create_passport',
            args: [
              new Address(deployer.publicKey()).toScVal(),
              nativeToScVal(samplePassportId, { type: 'string' }),
              nativeToScVal('Atelier Stellar Threads', { type: 'string' }),
              nativeToScVal('Celestial Silk Cashmere Trench', { type: 'string' }),
              nativeToScVal('ipfs://bafybeicelestialsilkcoatmetadata', { type: 'string' }),
              nativeToScVal('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', { type: 'string' }),
              nativeToScVal(25, { type: 'u32' }),
            ],
          })
        )
        .setTimeout(60)
        .build();
      const prepPass = await server.prepareTransaction(passTx);
      prepPass.sign(deployer);
      const passSend = await server.sendTransaction(prepPass);
      await waitForTx(server, passSend.hash);
      console.log(`✓ Genesis Digital Product Passport registered! Tx: ${passSend.hash}`);
      deploymentResults.contracts.product_passport.seedTxHash = passSend.hash;
    } else {
      console.log('Genesis product passport already exists on-chain.');
    }
  } catch (err) {
    console.warn(`Genesis passport notice: ${err.message}`);
  }

  // Ensure directories exist
  const depDir = path.resolve(__dirname, '..', 'deployments');
  if (!fs.existsSync(depDir)) fs.mkdirSync(depDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(deploymentResults, null, 2));

  // Also write to frontend config
  const frontendConfigDir = path.resolve(__dirname, '..', '..', 'stellar-threads-frontend', 'src', 'config');
  if (!fs.existsSync(frontendConfigDir)) fs.mkdirSync(frontendConfigDir, { recursive: true });
  fs.writeFileSync(path.join(frontendConfigDir, 'contracts.json'), JSON.stringify(deploymentResults, null, 2));

  // Also write to core src config
  const coreConfigDir = path.resolve(__dirname, '..', 'src', 'config');
  if (!fs.existsSync(coreConfigDir)) fs.mkdirSync(coreConfigDir, { recursive: true });
  fs.writeFileSync(path.join(coreConfigDir, 'contracts.json'), JSON.stringify(deploymentResults, null, 2));

  console.log('\n======================================================');
  console.log('  DEPLOYMENT COMPLETED AND MANIFEST EXPORTED!         ');
  console.log('======================================================');
  console.log(`Designer Registry: ${designerContract}`);
  console.log(`Product Passport:  ${passportContract}`);
  console.log(`Fashion Escrow:    ${escrowContract}`);
  console.log(`Manifest written to: ${manifestPath}`);
  console.log(`Frontend config written to: ${path.join(frontendConfigDir, 'contracts.json')}`);
}

main().catch((err) => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
