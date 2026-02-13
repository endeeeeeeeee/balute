import React from 'react';

const WalletSelector = ({ wallets, activeWalletId, onWalletChange }) => {
    if (!wallets || wallets.length === 0) return null;

    // Si solo hay una billetera, no mostrar selector
    if (wallets.length === 1) return null;

    const activeWallet = wallets.find(w => w.id === activeWalletId);

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg w-full sm:w-auto max-w-full overflow-hidden">
            <span className="text-sm text-gray-400 hidden sm:inline shrink-0">Billetera:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                <select
                    value={activeWalletId || ''}
                    onChange={(e) => onWalletChange(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer w-full sm:w-auto flex-1 max-w-[180px] sm:max-w-xs truncate"
                >
                    {wallets.map(wallet => (
                        <option key={wallet.id} value={wallet.id} className="truncate">
                            {wallet.name} {!wallet.isOwner && '(Lectura)'}
                        </option>
                    ))}
                </select>
                {activeWallet && !activeWallet.isOwner && (
                    <span className="text-xs text-yellow-400 whitespace-nowrap shrink-0" title="Solo lectura">
                        <span className="hidden sm:inline">Solo lectura</span>
                    </span>
                )}
            </div>
        </div>
    );
};

export default WalletSelector;
