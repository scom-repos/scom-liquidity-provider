import { ComboBox, IComboItem } from "@ijstech/components";
import ScomNetworkPicker from "@scom/scom-network-picker";
import ScomTokenInput from "@scom/scom-token-input";
import { State } from './store/index';
import { getOfferIndexes, getPair } from "./liquidity-utils";
import { tokenStore } from "@scom/scom-token-list";

const theme = {
    type: 'object',
    properties: {
        backgroundColor: {
            type: 'string',
            format: 'color'
        },
        fontColor: {
            type: 'string',
            format: 'color'
        },
        inputBackgroundColor: {
            type: 'string',
            format: 'color'
        },
        inputFontColor: {
            type: 'string',
            format: 'color'
        }
    }
}

export default {
    dataSchema: {
        type: 'object',
        properties: {
            chainId: {
                type: 'number',
                required: true
            },
            tokenIn: {
                type: 'string',
                required: true
            },
            tokenOut: {
                type: 'string',
                required: true
            },
            offerIndex: {
                type: 'string'
            },
            dark: theme,
            light: theme
        }
    },
    uiSchema: {
        type: 'Categorization',
        elements: [
            {
                type: 'Category',
                label: 'General',
                elements: [
                    {
                        type: 'VerticalLayout',
                        elements: [
                            {
                                type: 'Control',
                                scope: '#/properties/chainId'
                            },
                            {
                                type: 'Control',
                                scope: '#/properties/tokenIn'
                            },
                            {
                                type: 'Control',
                                scope: '#/properties/tokenOut'
                            },
                            {
                                type: 'Control',
                                scope: '#/properties/offerIndex'
                            }
                        ]
                    }
                ]
            },
            {
                type: 'Category',
                label: 'Theme',
                elements: [
                    {
                        type: 'VerticalLayout',
                        elements: [
                            {
                                type: 'Control',
                                label: 'Dark',
                                scope: '#/properties/dark'
                            },
                            {
                                type: 'Control',
                                label: 'Light',
                                scope: '#/properties/light'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    customControls(rpcWalletId: string, state: State) {
        let networkPicker: ScomNetworkPicker;
        let firstTokenInput: ScomTokenInput;
        let secondTokenInput: ScomTokenInput;
        let combobox: ComboBox;

        const initCombobox = async () => {
            if (!combobox) return;
            combobox.clear();
            const fromToken = firstTokenInput?.token;
            const toToken = secondTokenInput?.token;
            try {
                if (fromToken && toToken) {
                    const wallet = state.getRpcWallet();
                    const chainId = networkPicker.selectedNetwork?.chainId;
                    if (chainId && chainId != wallet.chainId) {
                        await wallet.switchNetwork(chainId);
                    }
                    const pairAddress = await getPair(state, fromToken, toToken);
                    const fromTokenAddress = fromToken.address?.toLowerCase() || fromToken.symbol;
                    const toTokenAddress = toToken.address?.toLowerCase() || toToken.symbol;
                    const offerIndexes = await getOfferIndexes(state, pairAddress, fromTokenAddress, toTokenAddress);
                    combobox.items = [{ label: '', value: '' }].concat(offerIndexes.map(v => { return { label: v.toString(), value: v.toString() } }));
                } else {
                    combobox.items = [{ label: '', value: '' }];
                }
            } catch {
                combobox.items = [{ label: '', value: '' }];
            }
        }

        return {
            "#/properties/chainId": {
                render: () => {
                    networkPicker = new ScomNetworkPicker(undefined, {
                        type: 'combobox',
                        networks: [1, 56, 137, 250, 97, 80001, 43113, 43114].map(v => { return { chainId: v } }),
                        onCustomNetworkSelected: () => {
                            const chainId = networkPicker.selectedNetwork?.chainId;
                            if (firstTokenInput.chainId != chainId) {
                                firstTokenInput.token = null;
                                secondTokenInput.token = null;
                                combobox.items = [{ label: '', value: '' }];
                                combobox.clear();
                            }
                            firstTokenInput.chainId = chainId;
                            secondTokenInput.chainId = chainId;
                        }
                    });
                    return networkPicker;
                },
                getData: (control: ScomNetworkPicker) => {
                    return control.selectedNetwork?.chainId;
                },
                setData: (control: ScomNetworkPicker, value: number) => {
                    control.setNetworkByChainId(value);
                    if (firstTokenInput) firstTokenInput.chainId = value;
                    if (secondTokenInput) secondTokenInput.chainId = value;
                }
            },
            "#/properties/tokenIn": {
                render: () => {
                    firstTokenInput = new ScomTokenInput(undefined, {
                        type: 'combobox',
                        isBalanceShown: false,
                        isBtnMaxShown: false,
                        isInputShown: false,
                        maxWidth: 300
                    });
                    firstTokenInput.rpcWalletId = rpcWalletId;
                    const chainId = networkPicker?.selectedNetwork?.chainId;
                    if (chainId && firstTokenInput.chainId !== chainId) {
                        firstTokenInput.chainId = chainId;
                    }
                    firstTokenInput.onSelectToken = () => {
                        initCombobox();
                    }
                    return firstTokenInput;
                },
                getData: (control: ScomTokenInput) => {
                    return control.token?.address || control.token?.symbol;
                },
                setData: (control: ScomTokenInput, value: string) => {
                    control.address = value;
                    initCombobox();
                }
            },
            "#/properties/tokenOut": {
                render: () => {
                    secondTokenInput = new ScomTokenInput(undefined, {
                        type: 'combobox',
                        isBalanceShown: false,
                        isBtnMaxShown: false,
                        isInputShown: false,
                        maxWidth: 300
                    });
                    secondTokenInput.rpcWalletId = rpcWalletId;
                    const chainId = networkPicker?.selectedNetwork?.chainId;
                    if (chainId && secondTokenInput.chainId !== chainId) {
                        secondTokenInput.chainId = chainId;
                    }
                    secondTokenInput.onSelectToken = () => {
                        initCombobox();
                    }
                    return secondTokenInput;
                },
                getData: (control: ScomTokenInput) => {
                    return control.token?.address || control.token?.symbol;
                },
                setData: (control: ScomTokenInput, value: string) => {
                    control.address = value;
                    initCombobox();
                }
            },
            "#/properties/offerIndex": {
                render: () => {
                    combobox = new ComboBox(undefined, {
                        maxWidth: 300,
                        height: 43,
                        items: [{ label: '', value: '' }]
                    });
                    return combobox;
                },
                getData: (control: ComboBox) => {
                    return (control.selectedItem as IComboItem)?.value || '';
                },
                setData: (control: ComboBox, value: string) => {
                    control.selectedItem = { label: value, value };
                }
            }
        }
    }
}
