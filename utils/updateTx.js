import axios from "axios";

export async function updateTx(txId) {

    async function getTxInfo() {
        const url = "https://api.koios.rest/api/v0/tx_info";
        const data = {
          _tx_hashes: [txId],
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
    
    return data;
}