import connectToDB from "./connectMysqlDB.js";

const queryDatabase=async (query,params)=>{
    try{
        const pool=await connectToDB()
        const connection=await pool.getConnection();
        const [rows]=await connection.execute(query,params);
        connection.release(); // Release the connection back to the pool
        return rows;
    } catch(e) {
        console.error(e);
        throw new Error("Database query error",e);
    }
};

export default queryDatabase;