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
    "SNet test token":"asset1eg7jp22f7qtczjj2da9nk65g6f49qkqtll93ku"
}

export function processTxInfo(matchingEntry, myVariable) {
    const wallet = myVariable.projectInfo.wallet

    const determineTxType = (txInfo) => {
        // Initialize variables
        let inputSum = 0;
        let outputSum = 0;
        const uniqueInputStakeAddr = new Set();
        const uniqueOutputStakeAddr = new Set();
      
        // Verify that inputs and outputs are defined and non-empty
        if (!txInfo.inputs || !txInfo.outputs || txInfo.inputs.length === 0 || txInfo.outputs.length === 0) {
          return 'Unknown';
        }
      
        // Check certificate conditions for "Delegation" and "Staking"
        let delegationCount = 0;
        let stakeRegistrationCount = 0;
      
        if (txInfo.certificates) {
          txInfo.certificates.forEach(cert => {
            if (cert.type === 'stake_registration') stakeRegistrationCount++;
            if (cert.type === 'delegation') delegationCount++;
          });
        }
      
        // Check if all stake_addr match myVariable.stake_addr in inputs and outputs
        const allMatchStakeAddr = txInfo.inputs.every(input => input && input.stake_addr === myVariable.stake_addr) &&
                                  txInfo.outputs.every(output => output && output.stake_addr === myVariable.stake_addr);
      
        // Populate unique stake addresses and calculate sum
        txInfo.inputs.forEach(input => {
          if (input && input.value && input.stake_addr) {
            inputSum += parseInt(input.value, 10);
            uniqueInputStakeAddr.add(input.stake_addr);
          }
        });
        txInfo.outputs.forEach(output => {
          if (output && output.value) {
            outputSum += parseInt(output.value, 10);
            uniqueOutputStakeAddr.add(output.stake_addr);
          }
        });
      
        // Determine txType
        let txType = 'Unknown';
      
        // Check for "Delegation"
        if (delegationCount === 1 && txInfo.certificates.length === 1) {
          txType = 'Delegation';
        }
        
        // Check for "Staking"
        else if (stakeRegistrationCount === 1 && txInfo.certificates.length === 2) {
          txType = 'Staking';
        }
      
        // Check for "Incoming"
        else if (uniqueOutputStakeAddr.has(myVariable.stake_addr) && !uniqueInputStakeAddr.has(myVariable.stake_addr)) {
          txType = 'Incoming';
        }
      
        // Check for "Outgoing"
        else if (uniqueInputStakeAddr.size === 1 && uniqueInputStakeAddr.has(myVariable.stake_addr) &&
                 Array.from(uniqueOutputStakeAddr).some(addr => addr !== myVariable.stake_addr || addr == null)) {
          txType = 'Outgoing';
        }

        else if (allMatchStakeAddr && inputSum === outputSum + parseInt(txInfo.fee, 10)) {
          txType = 'InternalTransfer'; 
        }
      
        else if (txInfo.withdrawals && txInfo.withdrawals.some(withdrawal => 'amount' in withdrawal)) {
          txType = 'RewardsWithdrawal';
        }
        
        return txType;
      };                         
      
    const compareData = (txMetadata, txInfo) => {
        const tx_Type = determineTxType(txInfo);
        console.log(`Transaction type: ${tx_Type}`);
        const txType = txMetadata.txType;
        const contributions = txMetadata.metadata.contributions;
        let result = {}

        let exchange_rate = txMetadata.metadata.msg.find(str => /@(\d+\.?\d*)/.test(str))?.match(/@(\d+\.?\d*)/)?.[1];
        const exchangeRate = parseFloat(txMetadata.metadata.msg.find(str => str.includes("ADA") && str.includes("USD"))?.match(/([\d.]+) USD/)?.[1] ?? NaN) / parseFloat(txMetadata.metadata.msg.find(str => str.includes("ADA") && str.includes("USD"))?.match(/([\d.]+) ADA/)?.[1] ?? NaN) || null;
        let finalExchangeRate = exchange_rate ?? parseFloat(exchangeRate).toFixed(3);

        if (tx_Type === 'Incoming') {
          result = compareIncoming(txInfo, contributions, txType);
        } else if (tx_Type === 'Outgoing') {
          result = compareOutgoing(txInfo, contributions, txType);
        } else if (tx_Type === 'Staking' || tx_Type === 'Delegation' || tx_Type === 'InternalTransfer') {
          result = compareStaking(txInfo, contributions, tx_Type);
        } else {
          result = compareRewardsWithdrawal(txInfo, contributions, txType);
        }

        result = {...result,
          'fee': txInfo.fee,
          'md_version': txMetadata.metadata.mdVersion[0],
          'transaction_date': txInfo.tx_timestamp * 1000,
          'tx_type': tx_Type == "Incoming" || tx_Type == "RewardsWithdrawal" ? tx_Type : "Outgoing",
          'transaction_id': txInfo.tx_hash,
          'project_id': myVariable.projectInfo.project_id,
          'recipients': txMetadata.metadata.msg.find(str => /Recipients: (\d+)/.test(str))?.match(/(\d+)/)?.[1],
          'exchange_rate': finalExchangeRate,
          'tx_json_url': txMetadata.tx_json_url,
          'tx_json': txMetadata.metadata
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
            'total_amounts': [] 
        };
        let walletStakeAddr = null;
        walletStakeAddr = myVariable.stake_addr;
        
        let decimalsInfo = { 'ADA': 6 };
    
        txInfo.outputs.forEach((output) => {
            if (output.stake_addr === walletStakeAddr) {
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
                    console.log(assetNameStr)
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
            finalResult['total_amounts'].push(Number((aggregatedResult[key] / Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key])));
            if (key == 'ADA') {
              finalResult['total_ada'] = Number(((Number(aggregatedResult[key]))/ Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key]))
            }
        });
    
        console.log("final result", finalResult)
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
    
        walletStakeAddr = myVariable.stake_addr;
    
        // Then process transactions that don't have this stake_addr
        txInfo.outputs.forEach((output) => {     
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
            finalResult['total_amounts'].push(Number((aggregatedResult[key] / Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key])));
            if (key == 'ADA') {
              finalResult['total_ada'] = Number(((Number(aggregatedResult[key]) + Number(txInfo.fee))/ Math.pow(10, decimalsInfo[key])).toFixed(decimalsInfo[key]))
            }
          });
        console.log("final result", finalResult)
        return finalResult;
    };              

  const compareStaking = (txInfo, contributions, txType) => {
    let result = {};
    if (txType == "Staking") {
      result = {total_tokens: ['ADA'], total_amounts: ['2']}
      result['total_ada'] = 2 + Number(parseFloat(txInfo.fee/ 1000000).toFixed(6))
    } else {
      result = {total_tokens: ['ADA'], total_amounts: ['0']}
      result['total_ada'] = 0 + Number(parseFloat(txInfo.fee/ 1000000).toFixed(6))
    }
    console.log("Result", result)
    return result;
  };

  const compareRewardsWithdrawal = (txInfo, contributions, txType) => {
    let result = {
      'total_tokens': [],
      'total_amounts': []
    };
    let rewards = parseFloat(txInfo.withdrawals[0].amount / 1000000).toFixed(6)
    result['total_amounts'] = [rewards];
    result['total_tokens'] = ['ADA']
    result['total_ada'] = rewards - Number(parseFloat(txInfo.fee/ 1000000).toFixed(6))
    console.log("Result", result)
    return result;
  };

  let data = compareData(matchingEntry.txMetadata, matchingEntry.txInfo);
  
  return data;
}
