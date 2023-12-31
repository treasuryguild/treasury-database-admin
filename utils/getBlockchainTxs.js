import axios from "axios";

export async function getBlockchainTxs(transactions, txids) {
    async function getTxInfo() {
        const url = "/api/getTxInfo";
        const data = {
          txids: txids,
        };
    
        const response = await axios.post(url, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        return response.data;
    }

    let data = await getTxInfo();
    // Create a mapping for quick look-up
    const txInfoMap = {};
    for (let i in data) {
      txInfoMap[data[i].tx_hash] = data[i];
    }
    
    // Merge the data
    const allTxs = [];
    for (let j in transactions) {
      const txid = transactions[j].metadata.txid;
      if (txInfoMap[txid]) {
        allTxs.push({
          txInfo: txInfoMap[txid],
          txMetadata: transactions[j]
        });
      }
    }
    
    return allTxs.sort((a, b) => a.txInfo.tx_timestamp - b.txInfo.tx_timestamp);
}