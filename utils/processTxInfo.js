const getContributorIdFromBech32 = (bech32) => bech32.substr(-6);
const convertADA = (value) => value / 1000000;
const getAssetAmount = (assetList, assetKey) => {
  let asset = assetList.find(asset => asset['token'] === assetKey);
  return asset ? asset['quantity'] : 0;
};

export function processTxInfo(txInfo, myVariable) {

    const compareData = (txMetadata, txInfo) => {
        const txType = txMetadata.txType;
        const contributions = txMetadata.txInfo.contributions;
      
        if (txType === 'Incoming') {
          return compareIncoming(txInfo, contributions, txType);
        } else if (txType === 'bulkTransactions') {
          return compareOutgoing(txInfo, contributions, txType);
        } else if (txType !== 'Incoming' || txType !== 'bulkTransactions') {
          return compareOther(txInfo, contributions, txType);
        }
      };
  
  const compareIncoming = (txInfo, contributions, txType) => {
    let result = {};
    const walletAddr = myVariable.projectInfo.wallet;
    result[txInfo.tx_hash] = {}
    result[txInfo.tx_hash]['txType'] = txType
    return result;
  };
  
  const compareOutgoing = (txInfo, contributions, txType) => {
    let result = {};
    result[txInfo.tx_hash] = {}
    result[txInfo.tx_hash]['txType'] = txType
    return result;
  };

  const compareOther = (txInfo, contributions, txType) => {
    let result = {};
    result[txInfo.tx_hash] = {}
    result[txInfo.tx_hash]['txType'] = txType
    return result;
  };

  let data = [];
  for (const tx of txInfo) { 
    let txData = compareData(tx.txMetadata, tx.txInfo);
    data.push(txData);
  }
  
  return data;
}
