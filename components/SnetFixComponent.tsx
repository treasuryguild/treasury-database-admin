import React from 'react';
import { useMyVariable } from '../context/MyVariableContext'

const SnetFixComponent = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    async function test() { 
        setMyVariable(prevState => ({
            ...prevState,
            transactions: [],
          }));
        console.log("Test 2", myVariable)
    }
    
    return (
        <div>
            <h2>This is the Snet Fix component</h2>
            <button onClick={test}>Fix database</button>
        </div>
    );
};

export default SnetFixComponent;
