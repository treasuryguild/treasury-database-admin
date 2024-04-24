// api/getGitHubTxs
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { Group, Project, wallet_type } = req.query;

    // Replace spaces with hyphens and normalize wallet_type
    const sanitizedGroup = Group.replace(/ /g, "-");
    const sanitizedProject = Project.replace(/ /g, "-");
    const normalizedWalletType = wallet_type.replace(/ /g, "").replace("Proposal", "");

    const baseUrl = `https://api.github.com/repos/treasuryguild/treasury-system-v4/contents/Transactions/${sanitizedGroup}/`;

    // Add your GitHub personal access token here
    const token = process.env.GITHUB_TOKEN;

    let transactions = [];
    let txids = [];
    let url = `${baseUrl}${normalizedWalletType}/${sanitizedProject}/`;

    if (normalizedWalletType.startsWith('Fund')) {
      const { data: folders } = await axios.get(baseUrl, { headers: { Authorization: `Bearer ${token}` } });
      const proposalFolder = folders.find(folder => folder.name === normalizedWalletType);
      if (proposalFolder) {
        url = `${baseUrl}${proposalFolder.name}/${sanitizedProject}/`;
      }
    }

    try {
      const { data: txTypes } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      for (const txType of txTypes) {
        if (!(txType.name).includes('Fund') && txType.name !== 'TreasuryWallet') {
          const txUrl = `${url}${txType.name}/`;
          const { data: files } = await axios.get(txUrl, { headers: { Authorization: `Bearer ${token}` } });

          // Fetch each file in parallel and add its content and timestamp to the transactions array
          const filePromises = files.map(file => axios.get(file.download_url, { headers: { Authorization: `Bearer ${token}` } }));
          const fileResponses = await Promise.all(filePromises);
          fileResponses.forEach((response, index) => {
            const txContent = response.data;
            const timestamp = files[index].name.split('-')[0];
            transactions.push({ txType: txType.name, metadata: txContent, txDate: timestamp, tx_json_url: files[index].download_url });
            if (txContent.txid) {
              txids.push(txContent.txid);
            }
          });
        }
      }

      res.status(200).json({ transactions, txids });
    } catch (error) {
      console.log(`Error fetching transactions: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}