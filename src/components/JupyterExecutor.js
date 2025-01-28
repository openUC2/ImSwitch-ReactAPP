import React, { useEffect, useState } from "react";

const JupyterExecutor = ({ hostIP, hostPort }) => {
  const [jupyterUrl, setJupyterUrl] = useState(null);

  useEffect(() => {
    const fetchNotebookUrl = async () => {
      try {
        // 1) Get the Jupyter URL with token from your custom endpoint
        const response = await fetch(`${hostIP}:${hostPort}/jupyternotebookurl`);
        const data = await response.json();

        // 2) Extract the Jupyter Notebook URL
        const notebookUrl = data["url"];


        // we need to replace the url between from start to :port provided by the server and match that with the hostIP
        const notebookUrlUpdated = notebookUrl.replace(/https?:\/\/[^:]+/, `${hostIP}`);
        setJupyterUrl(notebookUrlUpdated);
      } catch (error) {
        console.error("Error fetching Jupyter URL:", error);
      }
    };

    fetchNotebookUrl();
  }, [hostIP, hostPort]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {jupyterUrl ? (
        <iframe
          src={jupyterUrl}
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
          }}
          title="Jupyter Notebook"
        />
      ) : (
        <p>Loading Jupyter Notebook...</p>
      )}
    </div>
  );
};

export default JupyterExecutor;
