"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, ExternalLink, Shield, Smartphone, Monitor, Lock, Check, AlertCircle } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { 
  WalletType, 
  WalletConfig, 
  getRecommendedWallets, 
  getMobileWallets, 
  getHardwareWallets,
  WALLET_COPY
} from "@/lib/wallets";

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalletSelectionModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: WalletSelectionModalProps) {
  const { 
    connect, 
    state, 
    status, 
    walletConfig,
    clearError 
  } = useWalletConnection();

  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null);

  const recommendedWallets = getRecommendedWallets();
  const mobileWallets = getMobileWallets();
  const hardwareWallets = getHardwareWallets();

  const handleWalletSelect = async (walletType: WalletType) => {
    setSelectedWallet(walletType);
    setConnectingWallet(walletType);
    clearError();

    const success = await connect(walletType);
    
    if (success) {
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1000);
    }
    
    setConnectingWallet(null);
  };

  const handleInstallWallet = (wallet: WalletConfig) => {
    window.open(wallet.downloadUrl, '_blank');
  };

  const getWalletIcon = (wallet: WalletConfig) => {
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
        {wallet.icon}
      </div>
    );
  };

  const getWalletStatus = (walletType: WalletType) => {
    if (connectingWallet === walletType) {
      return 'connecting';
    }
    if (state.walletType === walletType && state.isConnected) {
      return 'connected';
    }
    return 'disconnected';
  };

  const WalletCard = ({ wallet, category }: { wallet: WalletConfig; category: string }) => {
    const walletStatus = getWalletStatus(wallet.id);
    const isConnecting = walletStatus === 'connecting';
    const isConnected = walletStatus === 'connected';

    return (
      <div className="relative">
        <Button
          variant="outline"
          className={`w-full h-auto p-4 justify-start border ${
            isConnected ? 'border-green-500/50 bg-green-900/20' : 'border-blue-900/20 hover:border-blue-600/50'
          } ${isConnecting ? 'opacity-50' : ''}`}
          onClick={() => !isConnected && !isConnecting && handleWalletSelect(wallet.id)}
          disabled={isConnecting || isConnected}
        >
          <div className="flex items-center gap-3 w-full">
            {getWalletIcon(wallet)}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{wallet.displayName}</h3>
                {wallet.recommended && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                    Recommended
                  </span>
                )}
                {wallet.isHardware && (
                  <Shield className="w-4 h-4 text-green-400" />
                )}
                {wallet.isMobile && (
                  <Smartphone className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{wallet.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isConnecting && (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              {isConnected && (
                <Check className="w-5 h-5 text-green-400" />
              )}
              {!isConnecting && !isConnected && (
                <ExternalLink className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </Button>
        
        {!isConnected && !isConnecting && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-xs text-blue-400 hover:text-blue-300"
            onClick={(e) => {
              e.stopPropagation();
              handleInstallWallet(wallet);
            }}
          >
            Install
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A0808]/90 backdrop-blur-sm border border-blue-900/20 text-white sm:max-w-[500px] shadow-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {WALLET_COPY.SELECT_WALLET}
          </DialogTitle>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            disabled={status === 'connecting'}
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="py-4">
          {/* Error Display */}
          {state.error && (
            <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-900/20 rounded-lg mb-4">
              <AlertCircle size={16} />
              {state.error}
            </div>
          )}

          {/* Connection Status */}
          {status === 'connecting' && (
            <div className="flex items-center gap-2 text-blue-400 text-sm p-3 bg-blue-900/20 rounded-lg mb-4">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              {WALLET_COPY.CONNECTING} to {connectingWallet && getWalletConfig(connectingWallet).displayName}...
            </div>
          )}

          {/* Recommended Wallets */}
          {recommendedWallets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span className="text-blue-400">⭐</span>
                Recommended Wallets
              </h3>
              <div className="space-y-2">
                {recommendedWallets.map(wallet => (
                  <WalletCard key={wallet.id} wallet={wallet} category="recommended" />
                ))}
              </div>
            </div>
          )}

          {/* Mobile Wallets */}
          {mobileWallets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Mobile Wallets
              </h3>
              <div className="space-y-2">
                {mobileWallets.map(wallet => (
                  <WalletCard key={wallet.id} wallet={wallet} category="mobile" />
                ))}
              </div>
            </div>
          )}

          {/* Hardware Wallets */}
          {hardwareWallets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Hardware Wallets
              </h3>
              <div className="space-y-2">
                {hardwareWallets.map(wallet => (
                  <WalletCard key={wallet.id} wallet={wallet} category="hardware" />
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-900/20 rounded-lg p-3 text-xs text-blue-300">
            <p className="mb-2">
              🔒 <strong>Security First:</strong> Your private keys never leave your wallet.
            </p>
            <p className="mb-2">
              🌐 <strong>Network Support:</strong> All wallets support Stellar Mainnet and Testnet.
            </p>
            <p>
              💡 <strong>Need Help?</strong> Visit the wallet's official website for installation guides.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://stellar.org/wallets', '_blank')}
            className="text-gray-400 hover:text-white"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Learn more
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={status === 'connecting'}
            className="border-gray-600 hover:bg-gray-600/10"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
