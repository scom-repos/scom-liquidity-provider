import { Module, customModule, Container, application } from '@ijstech/components';
import { getMulticallInfoList } from '@scom/scom-multicall';
import { INetwork } from '@ijstech/eth-wallet';
import getNetworkList from '@scom/scom-network-list';
import ScomLiquidityProvider from '@scom/scom-liquidity-provider';

@customModule
export default class Module1 extends Module {

    constructor(parent?: Container, options?: any) {
        super(parent, options);
        const multicalls = getMulticallInfoList();
        const networkMap = this.getNetworkMap(options.infuraId);
        application.store = {
            infuraId: options.infuraId,
            multicalls,
            networkMap
        }
    }

    private getNetworkMap = (infuraId?: string) => {
        const networkMap = {};
        const defaultNetworkList: INetwork[] = getNetworkList();
        const defaultNetworkMap: Record<number, INetwork> = defaultNetworkList.reduce((acc, cur) => {
            acc[cur.chainId] = cur;
            return acc;
        }, {});
        for (const chainId in defaultNetworkMap) {
            const networkInfo = defaultNetworkMap[chainId];
            const explorerUrl = networkInfo.blockExplorerUrls && networkInfo.blockExplorerUrls.length ? networkInfo.blockExplorerUrls[0] : "";
            if (infuraId && networkInfo.rpcUrls && networkInfo.rpcUrls.length > 0) {
                for (let i = 0; i < networkInfo.rpcUrls.length; i++) {
                    networkInfo.rpcUrls[i] = networkInfo.rpcUrls[i].replace(/{INFURA_ID}/g, infuraId);
                }
            }
            networkMap[networkInfo.chainId] = {
                ...networkInfo,
                symbol: networkInfo.nativeCurrency?.symbol || "",
                explorerTxUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}tx/` : "",
                explorerAddressUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}address/` : ""
            }
        }
        return networkMap;
    }

    async init() {
        super.init();
    }

    render() {
        return <i-panel>
            <i-hstack id="mainStack" margin={{ top: '1rem', left: '1rem' }} gap="2rem">
                <i-scom-liquidity-provider
                    chainId={421613}
                    tokenIn="0x096a13C9FaaEED2E7b62eC0435Ea5ce0a020e362"
                    tokenOut="0x00010b49B4A545B8390Be988e04d7e47487Fb5E1"
                    networks={[
                        {
                            "chainId": 43113
                        },
                        {
                            "chainId": 97
                        },
                        {
                            "chainId": 42161
                        },
                        {
                            "chainId": 421613
                        }
                    ]}
                    wallets={[
                        {
                            "name": "metamask"
                        }
                    ]}
                />
            </i-hstack>
        </i-panel>
    }
}