"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletSelectionModal } from "./WalletSelectionModal";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { 
  Wallet, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  Settings,
  LogOut,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { WALLET_COPY, STELLAR_COPY } from "@/lib/wallets";

interface WalletConnectionButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showAddress?: boolean;
  showNetwork?: boolean;
  className?: string;
  onConnectSuccess?: () => void;
}

export default function WalletConnectionButton({
  variant = "default",
  size = "default",
  showAddress = true,
  showNetwork = false,
  className = "",
  onConnectSuccess,
}: WalletConnectionButtonProps) {
  const { 
    state, 
    status, 
    walletConfig, 
    networkConfig, 
    formattedAddress,
    isReconnecting,
    canRetry,
    disconnect,
    refreshConnection,
    clearError
  } = useWalletConnection();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = () => {
    clearError();
    setShowWalletModal(true);
  };

  const handleDisconnect = async () => {
    setShowDropdown(false);
    await disconnect();
  };

  const handleRetry = async () => {
    setShowDropdown(false);
    await refreshConnection();
  };

  const handleSwitchWallet = () => {
    setShowDropdown(false);
    setShowWalletModal(true);
  };

  // Disconnected state
  if (!state.isConnected && status !== 'connecting') {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handleConnect}
          className={`bg-blue-600 hover:bg-blue-700 ${className}`}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {WALLET_COPY.CONNECT_WALLET}
        </Button>
        
        <WalletSelectionModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSuccess={onConnectSuccess}
        />
      </>
    );
  }

  // Connecting state
  if (status === 'connecting' || isReconnecting) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`${className}`}
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        {isReconnecting ? 'Reconnecting...' : WALLET_COPY.CONNECTING}
      </Button>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <>
        <div className="relative">
          <Button
            variant="outline"
            size={size}
            onClick={() => setShowDropdown(!showDropdown)}
            className={`border-red-500/50 text-red-400 hover:bg-red-900/20 ${className}`}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Connection Error
          </Button>
          
          {showDropdown && (
            <div className="absolute top-full mt-2 right-0 bg-[#1A0808]/95 backdrop-blur-sm border border-red-500/30 rounded-lg shadow-lg z-50 min-w-[200px]">
              <div className="p-3">
                <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                  <AlertTriangle size={16} />
                  {state.error || 'Connection failed'}
                </div>
                <div className="space-y-1">
                  {canRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRetry}
                      className="w-full justify-start text-red-400 hover:text-red-300"
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwitchWallet}
                    className="w-full justify-start text-red-400 hover:text-red-300"
                  >
                    <Wallet className="w-3 h-3 mr-2" />
                    Switch Wallet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <WalletSelectionModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSuccess={onConnectSuccess}
        />
      </>
    );
  }

  // Connected state
  return (
    <>
      <div className="relative">
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`bg-green-600 hover:bg-green-700 ${className}`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {showAddress && formattedAddress && (
            <span className="mr-2">{formattedAddress}</span>
          )}
          {showNetwork && networkConfig && (
            <span className="mr-2 text-xs">
              {networkConfig.isTestnet ? 'Testnet' : 'Mainnet'}
            </span>
          )}
          {walletConfig && (
            <span className="text-xs opacity-75">{walletConfig.icon}</span>
          )}
        </Button>
        
        {showDropdown && (
          <div className="absolute top-full mt-2 right-0 bg-[#1A0808]/95 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-lg z-50 min-w-[250px]">
            <div className="p-3">
              {/* Wallet Info */}
              <div className="mb-3 pb-3 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-sm">
                    {walletConfig?.icon}
                  </div>
                  <div>
                    <div className="font-medium text-white">{walletConfig?.displayName}</div>
                    <div className="text-xs text-gray-400">
                      {networkConfig?.displayName}
                    </div>
                  </div>
                </div>
                {formattedAddress && (
                  <div className="text-xs text-gray-400">
                    {STELLAR_COPY.STELLAR_ADDRESS}: {formattedAddress}
                  </div>
                )}
                {state.lastConnected && (
                  <div className="text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {WALLET_COPY.LAST_CONNECTED}: {new Date(state.lastConnected).toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwitchWallet}
                  className="w-full justify-start text-gray-300 hover:text-white"
                >
                  <Wallet className="w-3 h-3 mr-2" />
                  {WALLET_COPY.SWITCH_WALLET}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="w-full justify-start text-gray-300 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Refresh Connection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="w-full justify-start text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  {WALLET_COPY.DISCONNECT}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={onConnectSuccess}
      />
    </>
  );
}
