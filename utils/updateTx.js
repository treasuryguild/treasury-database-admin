import axios from "axios";
import { processTxInfo } from '../utils/processTxInfo'

export async function updateTx(transactions, txids, myVariable) {
    async function getTxInfo() {
        const url = "https://api.koios.rest/api/v0/tx_info";
        const data = {
          _tx_hashes: txids,
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
    const finalData = [];
    for (let j in transactions) {
      const txid = transactions[j].txInfo.txid;
      if (txInfoMap[txid]) {
        finalData.push({
          txInfo: txInfoMap[txid],
          txMetadata: transactions[j]
        });
      }
    }

    let txInfo = await processTxInfo(finalData, myVariable);
    console.log("getting txInfo")
    
    return txInfo;
}