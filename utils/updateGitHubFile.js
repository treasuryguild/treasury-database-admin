import axios from 'axios'

export async function updateGitHubFile(filename, updatedTransaction, sha) {
  const testFolderPath = "test-folder/"; // Replace with your test folder's name
  const apiUrl = `https://api.github.com/repos/treasuryguild/treasury-system-v4/contents/${testFolderPath}${filename}`;

  // Convert updatedTransaction object to a Base64 string
  const base64Content = btoa(JSON.stringify(updatedTransaction, null, 2));
  
  const payload = {
    message: 'Update transaction data in test folder',
    content: base64Content,
    sha: sha,
    branch: 'main',
  };

  const headers = {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
  };

  try {
    const response = await axios.put(apiUrl, payload, { headers: headers });
    if (response.status === 200) {
      console.log('Successfully updated file in test folder', filename);
    }
  } catch (error) {
    console.error('Error updating GitHub file:', error);
  }
}
