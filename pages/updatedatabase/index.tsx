import { useState, useEffect } from "react"; 
import type { NextPage } from "next";
import { useRouter } from 'next/router'
import styles from '../../styles/Home.module.css'
import { getProjects } from '../../utils/getProjects'
import { useMyVariable } from '../../context/MyVariableContext';

const UpdateDatabase: NextPage = () => {
  const router = useRouter()
  const { myVariable, setMyVariable } = useMyVariable();
  const [loading, setLoading] = useState<boolean>(false);

  async function getGroups() {
    const projects = await getProjects()
    console.log("Client side", projects)
  }

  useEffect(() => {  
    getGroups();      
  }, []);             

  return (
    <>
    <div className={styles.main}>
      <div className={styles.body}>
        <div>
          Update Database
        </div>
      </div>
    </div>
    </>
  );
};

export default UpdateDatabase;
