const getContributorIdFromBech32 = (bech32) => bech32.substr(-6);
const convertADA = (value) => value / 1000000;
const getAssetAmount = (assetList, assetKey) => {
  let asset = assetList.find(asset => asset['token'] === assetKey);
  return asset ? asset['quantity'] : 0;
};

export function processTxInfo(matchingEntry, wallet) {

    const compareData = (txMetadata, txInfo) => {
        const txType = txMetadata.txType;
        const contributions = txMetadata.metadata.contributions;
      
        if (txType === 'Incoming') {
          return compareIncoming(txInfo, contributions, txType);
        } else if (txType === 'bulkTransactions') {
          return compareOutgoing(txInfo, contributions, txType);
        } else if (txType !== 'Incoming' || txType !== 'bulkTransactions') {
          return compareOther(txInfo, contributions, txType);
        }
      };

      function hexToString(hex) {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
      }      
  
      const compareIncoming = (txInfo, contributions, txType) => {
        let result = {};
      
        // Initialize ADA key if it doesn't exist in the result object
        if (!result.hasOwnProperty('ADA')) {
          result['ADA'] = 0;
        }
      
        // Store decimals information for later
        let decimalsInfo = { 'ADA': 6 };
      
        txInfo.outputs.forEach((output) => {
          if (output.payment_addr && output.payment_addr.bech32 === wallet) {
            // Add ADA value
            result['ADA'] += parseInt(output.value, 10);
      
            output.asset_list.forEach((asset) => {
              const assetNameStr = hexToString(asset.asset_name); // Convert asset_name from hex to string
              if (!result.hasOwnProperty(assetNameStr)) {
                result[assetNameStr] = 0;
              }
              // Add asset quantity for aggregation
              result[assetNameStr] += parseInt(asset.quantity, 10);
      
              // Store decimals for each asset
              decimalsInfo[assetNameStr] = asset.decimals;
            });
          }
        });
      
        // Divide by respective decimals and format
        Object.keys(result).forEach((key) => {
          result[key] = (result[key] / Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key]);
        });
      
        return result;
      };                     
  
      const compareOutgoing = (txInfo, contributions, txType) => {
        const result = {};
        const totalAmounts = {};
        let walletStakeAddr = null;
      
        // Initialize an object to store decimals info for totalAmounts
        let totalAmountsDecimalsInfo = { 'ADA': 6 };
      
        // First, find the stake_addr that corresponds to the wallet in the inputs
        txInfo.inputs.forEach((input) => {
          if (input.payment_addr && input.payment_addr.bech32 === wallet) {
            walletStakeAddr = input.stake_addr;
          }
        });
      
        // Then process transactions that don't have this stake_addr
        txInfo.outputs.forEach((output) => {
          const outputWallet = output.payment_addr && output.payment_addr.bech32;
          if (output.stake_addr !== walletStakeAddr) {
            const walletId = getContributorIdFromBech32(outputWallet);
            if (!result.hasOwnProperty(walletId)) {
              result[walletId] = {};
            }
      
            // Initialize ADA key if it doesn't exist in the result object for the walletId
            if (!result[walletId].hasOwnProperty('ADA')) {
              result[walletId]['ADA'] = 0;
            }
      
            // Initialize decimalsInfo object to keep track of decimals for each asset
            let decimalsInfo = result[walletId]['decimalsInfo'] || { 'ADA': 6 };
      
            // Add ADA value
            const adaValue = parseInt(output.value, 10);
            result[walletId]['ADA'] += adaValue;
      
            // Update totalAmounts for ADA
            if (!totalAmounts.hasOwnProperty('ADA')) {
              totalAmounts['ADA'] = 0;
            }
            totalAmounts['ADA'] += adaValue;
      
            output.asset_list.forEach((asset) => {
              const assetNameStr = hexToString(asset.asset_name);
      
              if (!result[walletId].hasOwnProperty(assetNameStr)) {
                result[walletId][assetNameStr] = 0;
              }
      
              // Add asset quantity for aggregation
              const assetValue = parseInt(asset.quantity, 10);
              result[walletId][assetNameStr] += assetValue;
      
              // Update totalAmounts for each asset
              if (!totalAmounts.hasOwnProperty(assetNameStr)) {
                totalAmounts[assetNameStr] = 0;
              }
              totalAmounts[assetNameStr] += assetValue;
      
              // Store decimals for each asset
              if (assetNameStr == 'gimbal') {
                decimalsInfo[assetNameStr] = 6;
                totalAmountsDecimalsInfo[assetNameStr] = 6;
              } else {
                decimalsInfo[assetNameStr] = asset.decimals;
                totalAmountsDecimalsInfo[assetNameStr] = asset.decimals;
              }
              
            });
      
            result[walletId]['decimalsInfo'] = decimalsInfo;
          }
        });
      
        // Divide by respective decimals and format for each walletId
        Object.keys(result).forEach((walletId) => {
          const decimalsInfo = result[walletId]['decimalsInfo'];
          delete result[walletId]['decimalsInfo']; // Remove decimalsInfo from the result
          Object.keys(result[walletId]).forEach((key) => {
            result[walletId][key] = (result[walletId][key] / Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key]);
          });
        });
        console.log("Before division: ", totalAmounts);
        // Also divide totalAmounts by respective decimals and format
        Object.keys(totalAmounts).forEach((key) => {
          console.log('Decimals for gimbal: ', key,  totalAmountsDecimalsInfo[key]);
          totalAmounts[key] = (totalAmounts[key] / Math.pow(10, totalAmountsDecimalsInfo[key])).toFixed(totalAmountsDecimalsInfo[key]);
        });
        console.log("After division: ", totalAmounts);
        // Include totalAmounts in the final result
        result['totalAmounts'] = totalAmounts;
      
        return result;
      };                    

  const compareOther = (txInfo, contributions, txType) => {
    let result = {};
    
    return result;
  };

  let data = compareData(matchingEntry.txMetadata, matchingEntry.txInfo);
  
  return data;
}
