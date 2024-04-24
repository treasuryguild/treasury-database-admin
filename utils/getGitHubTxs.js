import axios from 'axios';

export async function getGitHubTxs(Group, Project, wallet_type) {
  // Replace spaces with hyphens and normalize wallet_type
  const sanitizedGroup = Group.replace(/ /g, "-");
  const sanitizedProject = Project.replace(/ /g, "-");
  const normalizedWalletType = wallet_type.replace(/ /g, "").replace("Proposal", "");

  const baseUrl = `https://api.github.com/repos/treasuryguild/treasury-system-v4/contents/Transactions/${sanitizedGroup}/`;
  let transactions = [];
  let txids = [];

  let url = `${baseUrl}${normalizedWalletType}/${sanitizedProject}/`;

  if (normalizedWalletType.startsWith('Fund')) {
    const { data: folders } = await axios.get(baseUrl);
    const proposalFolder = folders.find(folder => folder.name === normalizedWalletType);
    if (proposalFolder) {
      url = `${baseUrl}${proposalFolder.name}/${sanitizedProject}/`;
    }
  }

  try {
    const { data: txTypes } = await axios.get(url);

    for (const txType of txTypes) {
      if (!(txType.name).includes('Fund') && txType.name !== 'TreasuryWallet') {
        const txUrl = `${url}${txType.name}/`;
        const { data: files } = await axios.get(txUrl);

        // Fetch each file in parallel and add its content and timestamp to the transactions array
        const filePromises = files.map(file => axios.get(file.download_url));
        const fileResponses = await Promise.all(filePromises);
        
        fileResponses.forEach((response, index) => {
          const txContent = response.data;
          const timestamp = files[index].name.split('-')[0];
          transactions.push({
            txType: txType.name,
            metadata: txContent,
            txDate: timestamp,
            tx_json_url: files[index].download_url 
          });
          if (txContent.txid) {
            txids.push(txContent.txid); 
          }
        });
      }
    }
  } catch (error) {
    console.log(`Error fetching transactions: ${error}`);
  }
  
  return { transactions, txids };
}
