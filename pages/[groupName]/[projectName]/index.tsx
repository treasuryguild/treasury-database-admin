import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../context/MyVariableContext';
import { getOrgs } from '../../../utils/getOrgs';
import { getMonthlyBudget } from '../../../utils/getMonthlyBudget';
import { getTransactions } from '../../../utils/getTransactions';
import { getBlockchainTxs } from '../../../utils/getBlockchainTxs'
import { getGitHubTxs } from '../../../utils/getGitHubTxs'
import Link from 'next/link';
import styles from '../../../styles/Transactions.module.css';
import TransactionsTable from '../../../components/TransactionsTable'; 
import TransactionManager from '../../../components/TransactionManager'; 
import Balance from '../../../components/Balance';
import Report from '../../../components/Report';
import ManageDatabase from '../../../components/ManageDatabase';
import UpdateLastTransactions from '../../../components/UpdateLastTransactions';


interface Project {
    project_id: string;
    project_name: string;
    project_type: string;
    group: string;
}

const ProjectPage = () => {
    const [activeTab, setActiveTab] = useState<'transactions' | 'txmanager' | 'balance' | 'report' | 'managedatabase' | 'updatelasttransactions'>('transactions');
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName } = router.query;
    const [loading, setLoading] = useState<boolean>(false);
    const [projectData, setProjectData] = useState<Project | null>(null);

    useEffect(() => {
        const fetchGroupData = async (groupName: string, projectName: string) => {
            let groupInfo = myVariable.groupInfo;
            // If myVariable.groupInfo is empty, fetch the groupInfo
            if (!groupInfo || groupInfo.length === 0) {
                groupInfo = await getOrgs();
                setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
            }
    
            // Find the project from the updated groupInfo
            const foundGroup = groupInfo?.find(group => group.group_name === groupName);
            const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
            setProjectData(foundProject || null);
        };
    
        if (groupName && projectName) {
            fetchGroupData(groupName as string, projectName as string);
        }
    }, [groupName, projectName]);  // Removed myVariable and setMyVariable from the dependency array
    
    useEffect(() => {
        const fetchProjectData = async () => {
            let budgetInfo = myVariable.projectInfo;
            let txs = myVariable.transactions;
            let projectInfo: any = projectData;
            projectInfo = { ...projectInfo, group: groupName };
    
            // If foundProject exists, fetch the monthly budget
            if (projectData) {
                setLoading(true);
                budgetInfo = await getMonthlyBudget(projectData.project_id);
                txs = await getTransactions(projectData.project_id);
    
                // Call the new API route
                try {
                        const response = await fetch(`/api/getGitHubTxs?Group=${groupName}&Project=${projectName}&wallet_type=${projectData.project_type}`);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const { transactions, txids } = await response.json();
                        const allTxs = await getBlockchainTxs(transactions, txids);
                        const incomingTx = allTxs.find((entry: any) => entry.txMetadata.txType !== "Incoming");
                        const stake_addr = incomingTx?.txInfo.inputs[0].stake_addr;
                        setMyVariable(prevState => ({
                            ...prevState,
                            budgetInfo,
                            projectInfo,
                            transactions: txs,
                            transactionInfo: allTxs,
                            stake_addr
                        }));
                        setLoading(false);
                    } catch (error) {
                        console.error('Error fetching GitHub transactions:', error);
                        // Handle the error appropriately (e.g., show an error message to the user)
                    }
            }
        };
    
        fetchProjectData();
    }, [projectData]); 
    

    console.log("myVariable", myVariable);
    if (!projectData) return <div className={styles['main']}>Loading...</div>;

    return (
        <div className={styles['main']}>
            <div>
                <div className={styles.navbar}>
                    <button onClick={() => router.back()} className={styles.backButton}>Go Back</button>
                    <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? styles.active : styles.notactive}>Transactions</button>
                    <button onClick={() => setActiveTab('txmanager')} className={activeTab === 'txmanager' ? styles.active : styles.notactive}>Transaction Manager</button>
                    <button onClick={() => setActiveTab('balance')} className={activeTab === 'balance' ? styles.active : styles.notactive}>Balance</button>
                    <button onClick={() => setActiveTab('report')} className={activeTab === 'report' ? styles.active : styles.notactive}>Report</button>
                    <button onClick={() => setActiveTab('managedatabase')} className={activeTab === 'managedatabase' ? styles.active : styles.notactive}>Manage Database</button>
                    <button onClick={() => setActiveTab('updatelasttransactions')} className={activeTab === 'updatelasttransactions' ? styles.active : styles.notactive}>Update last transactions</button>
                </div>
            </div>
            {loading && (
                <div>
                    <div className={styles.loading}>Loading...</div>
                </div>
            )}
            {!loading && (
                activeTab === 'transactions' ? (
                    <TransactionsTable transactions={myVariable.transactions} groupName={groupName as string} projectName={projectName as string} />
                ) : activeTab === 'txmanager' ? (
                    <TransactionManager myVariable={myVariable} groupName={groupName as string} projectName={projectName as string} />
                ) : activeTab === 'balance' ? (
                    <Balance />
                ) : activeTab === 'report' ? (
                    <Report />
                ) : activeTab === 'managedatabase' ? (
                    <ManageDatabase myVariable={myVariable} groupName={groupName as string} projectName={projectName as string} />
                ) : activeTab === 'updatelasttransactions' ? (
                    <UpdateLastTransactions myVariable={myVariable} groupName={groupName as string} projectName={projectName as string} />
                ) : (
                    <div>nothing selected</div> 
                )
            )}
        </div>
    );
};

export default ProjectPage;