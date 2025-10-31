import React, { useEffect, useState, useRef } from "react";
import "./index.css";
import Header from "../../components/header";
import Footer from "../../components/footer";

// Import Web3 from CDN - we'll load it dynamically
const WEB3_CDN = "https://cdn.jsdelivr.net/npm/web3@1.10.0/dist/web3.min.js";

// Use multiple public Sepolia RPC endpoints with CORS support
const RPC_URLS = [
    'https://eth-sepolia.public.blastapi.io',
    'https://rpc2.sepolia.org',
    'https://ethereum-sepolia.publicnode.com',
    'https://sepolia.gateway.tenderly.co'
];

function Wallet() {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState('0');
    const [privateKeyRevealed, setPrivateKeyRevealed] = useState(false);
    const [currentTab, setCurrentTab] = useState('create');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [importPrivateKey, setImportPrivateKey] = useState('');
    const [isWeb3Loaded, setIsWeb3Loaded] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');

    const currentRpcIndexRef = useRef(0);
    const autoRefreshIntervalRef = useRef(null);
    const previousBalanceRef = useRef('0');
    const isFirstBalanceCheckRef = useRef(true);

    // Toast notification system
    const showToast = (title, message, type = 'info', duration = 5000) => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // Load Web3 dynamically
    useEffect(() => {
        const loadWeb3 = () => {
            if (window.Web3) {
                setIsWeb3Loaded(true);
                setConnectionStatus('Web3 loaded');
                return;
            }

            const script = document.createElement('script');
            script.src = WEB3_CDN;
            script.async = true;
            script.onload = () => {
                setIsWeb3Loaded(true);
                setConnectionStatus('Web3 loaded');
                showToast('Success', 'Web3 library loaded successfully!', 'success', 3000);
            };
            script.onerror = () => {
                setConnectionStatus('Failed to load Web3');
                showToast('Error', 'Failed to load Web3 library. Please check your internet connection.', 'error');
            };
            document.body.appendChild(script);
        };

        loadWeb3();

        return () => {
            stopAutoRefresh();
        };
    }, []);

    // Initialize Web3 connection
    const initWeb3 = async () => {
        if (!window.Web3) {
            showToast('Error', 'Web3 library not loaded', 'error');
            return false;
        }

        for (let i = 0; i < RPC_URLS.length; i++) {
            try {
                currentRpcIndexRef.current = i;
                const provider = new window.Web3.providers.HttpProvider(RPC_URLS[i]);
                const web3Instance = new window.Web3(provider);

                await web3Instance.eth.getBlockNumber();
                console.log(`Connected to RPC: ${RPC_URLS[i]}`);
                setWeb3(web3Instance);
                setConnectionStatus('Connected to Sepolia');
                return web3Instance;
            } catch (error) {
                console.log(`Failed to connect to ${RPC_URLS[i]}`);
                if (i === RPC_URLS.length - 1) {
                    setConnectionStatus('Connection failed');
                    showToast('Error', 'Could not connect to Sepolia. See instructions to run a local server.', 'error', 10000);
                    return null;
                }
            }
        }
        return null;
    };

    // Create new wallet
    const createWallet = async () => {
        try {
            showToast('Info', 'Connecting to Sepolia network...', 'info', 3000);

            const web3Instance = await initWeb3();
            if (!web3Instance) return;

            const newAccount = web3Instance.eth.accounts.create();
            setAccount(newAccount);

            showToast('Success', 'Wallet created successfully!', 'success', 5000);
            isFirstBalanceCheckRef.current = true;
            refreshBalance(web3Instance, newAccount);
            startAutoRefresh(web3Instance, newAccount);
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to create wallet: ' + error.message, 'error');
        }
    };

    // Import wallet
    const importWallet = async () => {
        if (!importPrivateKey.trim()) {
            showToast('Error', 'Please enter a private key', 'error');
            return;
        }

        try {
            showToast('Info', 'Connecting to Sepolia network...', 'info', 3000);

            const web3Instance = await initWeb3();
            if (!web3Instance) return;

            const formattedKey = importPrivateKey.startsWith('0x') ? importPrivateKey : '0x' + importPrivateKey;
            const importedAccount = web3Instance.eth.accounts.privateKeyToAccount(formattedKey);
            setAccount(importedAccount);

            showToast('Success', 'Wallet imported successfully!', 'success', 5000);
            isFirstBalanceCheckRef.current = true;
            refreshBalance(web3Instance, importedAccount);
            startAutoRefresh(web3Instance, importedAccount);
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to import wallet: ' + error.message, 'error');
        }
    };

    // Refresh balance
    const refreshBalance = async (web3Instance = web3, currentAccount = account) => {
        if (!web3Instance || !currentAccount) return;

        try {
            const balanceWei = await web3Instance.eth.getBalance(currentAccount.address);
            const ethBalance = web3Instance.utils.fromWei(balanceWei, 'ether');
            const currentBalance = parseFloat(ethBalance).toFixed(6);

            setBalance(currentBalance);

            if (!isFirstBalanceCheckRef.current) {
                const previousBal = parseFloat(previousBalanceRef.current);
                const currentBal = parseFloat(currentBalance);

                if (currentBal > previousBal) {
                    const received = (currentBal - previousBal).toFixed(6);
                    showToast(
                        '💰 ETH Received!',
                        `You received ${received} ETH`,
                        'success',
                        7000
                    );
                }
            }

            previousBalanceRef.current = currentBalance;
            isFirstBalanceCheckRef.current = false;
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to fetch balance: ' + error.message, 'error');
        }
    };

    // Start auto-refresh
    const startAutoRefresh = (web3Instance = web3, currentAccount = account) => {
        stopAutoRefresh();
        autoRefreshIntervalRef.current = setInterval(() => {
            refreshBalance(web3Instance, currentAccount);
        }, 10000);
    };

    // Stop auto-refresh
    const stopAutoRefresh = () => {
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }
    };

    // Send transaction
    const sendTransaction = async () => {
        if (!recipientAddress || !sendAmount) {
            showToast('Error', 'Please enter both recipient address and amount', 'error');
            return;
        }

        if (!web3.utils.isAddress(recipientAddress)) {
            showToast('Error', 'Invalid recipient address', 'error');
            return;
        }

        if (parseFloat(sendAmount) <= 0) {
            showToast('Error', 'Amount must be greater than 0', 'error');
            return;
        }

        try {
            showToast('Info', 'Preparing transaction...', 'info', 3000);

            const gasPrice = await web3.eth.getGasPrice();
            const nonce = await web3.eth.getTransactionCount(account.address);

            const tx = {
                from: account.address,
                to: recipientAddress,
                value: web3.utils.toWei(sendAmount, 'ether'),
                gas: 21000,
                gasPrice: gasPrice,
                nonce: nonce
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);

            showToast('Info', 'Sending transaction...', 'info', 3000);

            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            showToast(
                '🎉 Transaction Successful!',
                `Sent ${sendAmount} ETH to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
                'success',
                8000
            );

            console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${receipt.transactionHash}`);

            setRecipientAddress('');
            setSendAmount('');

            setTimeout(() => refreshBalance(), 2000);
        } catch (error) {
            console.error(error);
            if (error.message.includes('insufficient funds')) {
                showToast('Error', 'Insufficient funds for transaction', 'error', 6000);
            } else {
                showToast('Error', 'Transaction failed: ' + error.message, 'error', 6000);
            }
        }
    };

    // Toggle private key visibility
    const togglePrivateKey = () => {
        setPrivateKeyRevealed(!privateKeyRevealed);
    };

    // Copy address
    const copyAddress = () => {
        navigator.clipboard.writeText(account.address);
        showToast('Success', 'Address copied to clipboard!', 'success', 3000);
    };

    // Copy private key
    const copyPrivateKey = () => {
        navigator.clipboard.writeText(account.privateKey);
        showToast('Success', 'Private key copied to clipboard!', 'success', 3000);
    };

    // Logout
    const logout = () => {
        if (window.confirm('Are you sure you want to logout? Make sure you have saved your private key!')) {
            stopAutoRefresh();
            setAccount(null);
            setPrivateKeyRevealed(false);
            isFirstBalanceCheckRef.current = true;
            previousBalanceRef.current = '0';
            setBalance('0');
            setImportPrivateKey('');
            showToast('Info', 'Logged out successfully', 'info');
        }
    };

    return (
        <div>
            <div className="header_section">
                <Header />
            </div>

            <div id="toast-container" className="toast-container"></div>

            <div className="wallet_section layout_padding">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="wallet_main">
                                <hr className="border" />
                                <h1 className="wallet_taital">ETH Wallet</h1>
                                <hr className="border" />
                            </div>
                            <p className="wallet_subtitle">Manage your Ethereum on Sepolia Testnet</p>
                            <div className="testnet-badge">⚠️ Sepolia Testnet</div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <div className="alert alert-info">
                                <strong>💡 Having connection issues?</strong><br />
                                If you see CORS errors, you need to run this file through a local server:<br />
                                <strong>Python:</strong> <code>python -m http.server 8000</code><br />
                                <strong>Node.js:</strong> <code>npx http-server</code><br />
                                Then open: <code>http://localhost:8000</code>
                            </div>
                        </div>
                    </div>

                    {!account ? (
                        <div id="setup-section">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="warning-box">
                                        <h3>⚠️ Security Warning</h3>
                                        <p>This wallet stores your private key in browser memory. For testing purposes only! Never use with real ETH on mainnet. Always keep your private key secure and never share it.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="tabs">
                                        <button
                                            className={`tab ${currentTab === 'create' ? 'active' : ''}`}
                                            onClick={() => setCurrentTab('create')}
                                        >
                                            Create New Wallet
                                        </button>
                                        <button
                                            className={`tab ${currentTab === 'import' ? 'active' : ''}`}
                                            onClick={() => setCurrentTab('import')}
                                        >
                                            Import Wallet
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {currentTab === 'create' ? (
                                <div id="create-tab" className="row">
                                    <div className="col-md-12">
                                        <div className="wallet-action-btn">
                                            <button className="wallet-btn wallet-btn-primary" onClick={createWallet} disabled={!isWeb3Loaded}>
                                                🆕 Generate New Wallet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div id="import-tab" className="row">
                                    <div className="col-md-12">
                                        <div className="input-group">
                                            <label>Private Key (64 characters, no 0x prefix)</label>
                                            <input
                                                type="password"
                                                className="wallet-input"
                                                value={importPrivateKey}
                                                onChange={(e) => setImportPrivateKey(e.target.value)}
                                                placeholder="Enter your private key"
                                            />
                                        </div>
                                        <div className="wallet-action-btn">
                                            <button className="wallet-btn wallet-btn-primary" onClick={importWallet} disabled={!isWeb3Loaded}>
                                                📥 Import Wallet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div id="wallet-section">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="wallet-info">
                                        <div className="wallet-item">
                                            <label>Your Address</label>
                                            <div className="wallet-value">{account.address}</div>
                                            <button className="copy-btn" onClick={copyAddress}>Copy Address</button>
                                        </div>

                                        <div className="wallet-item">
                                            <label>Private Key (Keep Secret!)</label>
                                            <div
                                                className="wallet-value"
                                                style={{ filter: privateKeyRevealed ? 'none' : 'blur(5px)' }}
                                            >
                                                {account.privateKey}
                                            </div>
                                            <button className="copy-btn" onClick={togglePrivateKey}>
                                                {privateKeyRevealed ? 'Hide' : 'Show'}
                                            </button>
                                            <button className="copy-btn" onClick={copyPrivateKey}>Copy</button>
                                        </div>

                                        <div className="balance">
                                            {balance} ETH
                                            <span className="auto-refresh-indicator" title="Auto-refreshing every 10 seconds"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="send-section">
                                        <h3 className="send-title">📤 Send ETH</h3>
                                        <div className="input-group">
                                            <label>Recipient Address</label>
                                            <input
                                                type="text"
                                                className="wallet-input"
                                                value={recipientAddress}
                                                onChange={(e) => setRecipientAddress(e.target.value)}
                                                placeholder="0x..."
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Amount (ETH)</label>
                                            <input
                                                type="number"
                                                className="wallet-input"
                                                value={sendAmount}
                                                onChange={(e) => setSendAmount(e.target.value)}
                                                placeholder="0.01"
                                                step="0.001"
                                                min="0"
                                            />
                                        </div>
                                        <div className="wallet-action-btn">
                                            <button className="wallet-btn wallet-btn-primary" onClick={sendTransaction}>Send ETH</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="faucet-links">
                                        <h3>🚰 Get Free Test ETH</h3>
                                        <p className="faucet-description">Copy your address above and use these faucets:</p>
                                        <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noopener noreferrer">Alchemy Sepolia Faucet</a>
                                        <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer">Sepolia Faucet</a>
                                        <a href="https://www.infura.io/faucet/sepolia" target="_blank" rel="noopener noreferrer">Infura Sepolia Faucet</a>
                                        <a href="https://faucet.quicknode.com/ethereum/sepolia" target="_blank" rel="noopener noreferrer">QuickNode Faucet</a>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="wallet-action-btn">
                                        <button className="wallet-btn wallet-btn-danger" onClick={logout}>
                                            🚪 Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Wallet;
