const getContributorIdFromBech32 = (bech32) => bech32.substr(-6);
const convertADA = (value) => value / 1000000;
const getAssetAmount = (assetList, assetKey) => {
  let asset = assetList.find(asset => asset['token'] === assetKey);
  return asset ? asset['quantity'] : 0;
};

const tickers = {
    "GMBL":"asset1seuf4pwhwdxqtrsz4axfwtrp94gkdlhcyat9nn",
    "AGIX":"asset1wwyy88f8u937hz7kunlkss7gu446p6ed5gdfp6",
    "COPI":"asset1c6uau7pufsxhnm7eg0eerhu4snwfd9sn7kvvvz",
}

export function processTxInfo(matchingEntry, myVariable) {
    const wallet = myVariable.projectInfo.wallet
    const compareData = (txMetadata, txInfo) => {
        const txType = txMetadata.txType;
        const contributions = txMetadata.metadata.contributions;
        let result = {}
      
        if (txType === 'Incoming') {
          result = compareIncoming(txInfo, contributions, txType);
        } else if (txType === 'bulkTransactions') {
          result = compareOutgoing(txInfo, contributions, txType);
        } else if (txType !== 'Incoming' || txType !== 'bulkTransactions') {
          result = compareOther(txInfo, contributions, txType);
        }
        result = {...result,
          'fee': txInfo.fee,
          'transaction_date': txInfo.tx_timestamp * 1000,
          'tx_type': txType == "Incoming" ? txType : "Outgoing",
          'transaction_id': txInfo.tx_hash
        }
        return result;
      };

      function hexToString(hex) {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
      }      
  
      const compareIncoming = (txInfo, contributions, txType) => {
        let aggregatedResult = {};
        let finalResult = {
            'total_tokens': [],
            'total_amounts': [],
            'fee': txInfo.fee  // Assuming txInfo.fee is available
        };
    
        // Store decimals information for later
        let decimalsInfo = { 'ADA': 6 };
    
        txInfo.outputs.forEach((output) => {
            if (output.payment_addr && output.payment_addr.bech32 === wallet) {
                // Handle ADA
                if (!aggregatedResult.hasOwnProperty('ADA')) {
                    aggregatedResult['ADA'] = 0;
                }
                aggregatedResult['ADA'] += parseInt(output.value, 10);
    
                // Handle other assets
                output.asset_list.forEach((asset) => {
                    // Get asset name from tickers using the fingerprint
                    let assetNameStr = Object.keys(tickers).find(key => tickers[key] === asset.fingerprint);
                    
                    if (!assetNameStr) {
                        assetNameStr = hexToString(asset.asset_name);
                    }
    
                    if (!aggregatedResult.hasOwnProperty(assetNameStr)) {
                        aggregatedResult[assetNameStr] = 0;
                    }
                    aggregatedResult[assetNameStr] += parseInt(asset.quantity, 10);
    
                    // Store decimals for each asset
                    if (assetNameStr === 'GMBL') {
                        decimalsInfo[assetNameStr] = 6;
                    } else {
                        decimalsInfo[assetNameStr] = asset.decimals;
                    }
                });
            }
        });
    
        // Divide by respective decimals and format, then populate the arrays
        Object.keys(aggregatedResult).forEach((key) => {
            finalResult['total_tokens'].push(key);
            finalResult['total_amounts'].push((aggregatedResult[key] / Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key]));
        });
    
        // Add transaction date to finalResult
        finalResult['transaction_date'] = txInfo.tx_timestamp * 1000;
    
        return finalResult;
    };
    
      const compareOutgoing = (txInfo, contributions, txType) => {
        const finalResult = {
            'total_tokens': [],
            'total_amounts': []
        };
        const aggregatedResult = {};
        let walletStakeAddr = null;
        let decimalsInfo = { 'ADA': 6 };
    
        walletStakeAddr = txInfo.inputs[0].stake_addr;
    
        // Then process transactions that don't have this stake_addr
        txInfo.outputs.forEach((output) => {
            const outputWallet = output.payment_addr && output.payment_addr.bech32;
            if (output.stake_addr !== walletStakeAddr) {
                // Initialize ADA
                if (!aggregatedResult.hasOwnProperty('ADA')) {
                    aggregatedResult['ADA'] = 0;
                }
    
                // Add ADA value
                const adaValue = parseInt(output.value, 10);
                aggregatedResult['ADA'] += adaValue;
    
                output.asset_list.forEach((asset) => {
                    let assetNameStr = Object.keys(tickers).find(key => tickers[key] === asset.fingerprint);
                    if (!assetNameStr) {
                        assetNameStr = hexToString(asset.asset_name);
                    }
    
                    // Initialize asset key
                    if (!aggregatedResult.hasOwnProperty(assetNameStr)) {
                        aggregatedResult[assetNameStr] = 0;
                    }
    
                    // Add asset quantity for aggregation
                    const assetValue = parseInt(asset.quantity, 10);
                    aggregatedResult[assetNameStr] += assetValue;
    
                    // Store decimals for each asset
                    if (assetNameStr === 'GMBL') {
                        decimalsInfo[assetNameStr] = 6;
                    } else {
                        decimalsInfo[assetNameStr] = asset.decimals;
                    }
                });
            }
        });
    
        // Divide aggregatedResult by respective decimals and format, then populate the arrays
        Object.keys(aggregatedResult).forEach((key) => {
            finalResult['total_tokens'].push(key);
            finalResult['total_amounts'].push((aggregatedResult[key] / Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key]));
        });
    
        return finalResult;
    };              

  const compareOther = (txInfo, contributions, txType) => {
    let result = {};
    
    return result;
  };

  let data = compareData(matchingEntry.txMetadata, matchingEntry.txInfo);
  
  return data;
}
