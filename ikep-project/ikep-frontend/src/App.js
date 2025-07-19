import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./IKEP_SingleMatch.json";
import addressJSON from "./contractAddress.json";
import "./App.css";

const CONTRACT_ADDRESS = addressJSON.address;

function App() {
  const [contract, setContract] = useState(null);
  const [status, setStatus] = useState("❌ Hospital not connected");
  const [matchResult, setMatchResult] = useState("");
  const [score, setScore] = useState(null);

  const [donor, setDonor] = useState({
    age: "",
    hla: "",
    bloodGroup: "",
    kidneySize: "",
    pincode: "",
  });

  const [patient, setPatient] = useState({
    age: "",
    hla: "",
    bloodGroup: "",
    kidneySize: "",
    pra: "",
    pincode: "",
  });

  const [donorSaved, setDonorSaved] = useState(false);
  const [patientSaved, setPatientSaved] = useState(false);

  useEffect(() => {
    connectToContract();
  }, []);

  const connectToContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const instance = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);
      setContract(instance);
      const account = await signer.getAddress();
      setStatus(`✅ Hospital connected (${account.slice(0, 6)}...${account.slice(-4)})`);
    } catch (err) {
      console.error("Connection failed:", err);
      setStatus("❌ Connection failed");
    }
  };

  const submitDonor = async () => {
    try {
      const hlaArray = donor.hla.split(",").map(x => x.trim()).filter(Boolean);
      const tx = await contract.submitDonor(
        Number(donor.age),
        hlaArray,
        donor.bloodGroup,
        Number(donor.kidneySize),
        donor.pincode
      );
      await tx.wait();
      setDonorSaved(true);
    } catch (err) {
      console.error("Donor submission failed:", err);
      alert("Donor submission failed.");
    }
  };

  const submitPatient = async () => {
    try {
      const hlaArray = patient.hla.split(",").map(x => x.trim()).filter(Boolean);
      const tx = await contract.submitPatient(
        Number(patient.age),
        hlaArray,
        patient.bloodGroup,
        Number(patient.kidneySize),
        Number(patient.pra),
        patient.pincode
      );
      await tx.wait();
      setPatientSaved(true);
    } catch (err) {
      console.error("Patient submission failed:", err);
      alert("Patient submission failed.");
    }
  };

  const runMatch = async () => {
    try {
      const scoreValue = await contract.viewScore();
      setScore(scoreValue.toString());

      const tx = await contract.matchNow();
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        const matchedEvent = receipt.logs.find(log =>
          log.topics[0] === contract.interface.getEventTopic("Matched")
        );
        const notMatchedEvent = receipt.logs.find(log =>
          log.topics[0] === contract.interface.getEventTopic("NotMatched")
        );

        if (matchedEvent) {
          setMatchResult("✅ Match Found");
        } else if (notMatchedEvent) {
          setMatchResult("❌ No Match Found");
        } else {
          setMatchResult("❌ Match result unknown");
        }
      } else {
        setMatchResult("❌ Transaction failed");
      }
    } catch (err) {
      console.error("Matching failed:", err);
      setMatchResult("❌ Match execution error");
    }
  };

  return (
    <div className="page-background">
      <div className="container">
        <h2 className="title">Indian Kidney Exchange Program</h2>
        <p className="status">{status}</p>

        <div className="form-section">
          <h3 className="section-heading">Donor Details</h3>
          <input placeholder="Age" onChange={e => setDonor({ ...donor, age: e.target.value })} />
          <input placeholder="HLA (comma-separated)" onChange={e => setDonor({ ...donor, hla: e.target.value })} />
          <input placeholder="Blood Group" onChange={e => setDonor({ ...donor, bloodGroup: e.target.value })} />
          <input placeholder="Kidney Size" onChange={e => setDonor({ ...donor, kidneySize: e.target.value })} />
          <input placeholder="Pincode" onChange={e => setDonor({ ...donor, pincode: e.target.value })} />
          <button
            onClick={submitDonor}
            style={{ backgroundColor: donorSaved ? "#4CAF50" : "#1a73e8", color: "#fff" }}
          >
            {donorSaved ? "✅ Donor Saved" : "Submit Donor"}
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-heading">Patient Details</h3>
          <input placeholder="Age" onChange={e => setPatient({ ...patient, age: e.target.value })} />
          <input placeholder="HLA (comma-separated)" onChange={e => setPatient({ ...patient, hla: e.target.value })} />
          <input placeholder="Blood Group" onChange={e => setPatient({ ...patient, bloodGroup: e.target.value })} />
          <input placeholder="Kidney Size" onChange={e => setPatient({ ...patient, kidneySize: e.target.value })} />
          <input placeholder="PRA" onChange={e => setPatient({ ...patient, pra: e.target.value })} />
          <input placeholder="Pincode" onChange={e => setPatient({ ...patient, pincode: e.target.value })} />
          <button
            onClick={submitPatient}
            style={{ backgroundColor: patientSaved ? "#4CAF50" : "#1a73e8", color: "#fff" }}
          >
            {patientSaved ? "✅ Patient Saved" : "Submit Patient"}
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-heading">Run Matching</h3>
          <button onClick={runMatch}>Run Match</button>
          <p className="match-result">{matchResult}</p>
          {score !== null && (
            <p className="score">🔬 Compatibility Score: {score}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;