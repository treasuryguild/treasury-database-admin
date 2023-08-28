import React from 'react';
import { deleteTransactions } from '../utils/deleteTransactions'


interface ManageDatabaseProps {
    myVariable: any;
    groupName: string;
    projectName: string;
  }

  const ManageDatabase: React.FC<ManageDatabaseProps> = ({ myVariable, groupName, projectName }) => {
    
    console.log("myVariable inside Database management", myVariable)

    async function deleteTxs() {
        const status = await deleteTransactions(myVariable.projectInfo.project_id);
        console.log("deleting txs", status)
    }

    return (
        <div>
            <h2>Database management</h2>
            <p>You can add any content you want here.</p>
            <button onClick={deleteTxs} className="navitems">
            Delete All Txs
            </button>
        </div>
    );
};

export default ManageDatabase;
