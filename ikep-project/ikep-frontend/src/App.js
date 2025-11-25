import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./IKEP_SingleMatch.json";
import addressJSON from "./contractAddress.json";
import "./App.css";

const CONTRACT_ADDRESS = addressJSON.address;

function Landing({ onEnter }) {
  // Use the public logo placed in /public/ikep-logo.png
  return (
    <div className="landing-page">
      <div className="landing-card">
        <img src="/ikep-logo.png" alt="IKEP logo" className="landing-logo" />
        <h1 className="landing-title">Welcome to IKEP</h1>
        <p className="landing-sub">Indian Kidney Exchange Program — secure, transparent, and community-driven.</p>

        <div className="cta-row">
          <button className="enter-btn" onClick={onEnter}>Enter</button>
          <button className="learn-btn" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
            Learn more
          </button>
        </div>

        <div className="pulse" aria-hidden="true" />
      </div>
      <div className="landing-footer">Trusted Hospitals · Privacy-first · Immutable Records</div>
    </div>
  );
}

function MainApp() {
  const [contract, setContract] = useState(null);
  const [status, setStatus] = useState("❌ Hospital not connected");
  const [matchResult, setMatchResult] = useState("");
  const [score, setScore] = useState(null);

  const [donor, setDonor] = useState({ age: "", hla: "", bloodGroup: "", kidneySize: "", pincode: "" });
  const [patient, setPatient] = useState({ age: "", hla: "", bloodGroup: "", kidneySize: "", pra: "", pincode: "" });

  const [donorSaved, setDonorSaved] = useState(false);
  const [patientSaved, setPatientSaved] = useState(false);

  const [loadingDonor, setLoadingDonor] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    // Attempt one-time connect (safe guard if MetaMask isn't available)
    connectToContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectToContract = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      setStatus("⏳ Connecting...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const instance = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);
      setContract(instance);
      const account = await signer.getAddress();
      setStatus(`✅ Hospital Connected (${account.slice(0,6)}...${account.slice(-4)})`);
    } catch (err) {
      console.error("connectToContract:", err);
      setStatus("❌ Connection failed");
    }
  };

  const submitDonor = async () => {
    if (!contract) return alert("Connect your wallet first.");
    if (!donor.age) return alert("Please enter donor age.");
    setLoadingDonor(true);
    try {
      const hlaArray = donor.hla ? donor.hla.split(",").map(s => s.trim()).filter(Boolean) : [];
      const tx = await contract.submitDonor(
        Number(donor.age),
        hlaArray,
        donor.bloodGroup,
        Number(donor.kidneySize || 0),
        donor.pincode
      );
      await tx.wait();
      setDonorSaved(true);
      setMatchResult("✅ Donor saved on-chain");
    } catch (err) {
      console.error("submitDonor:", err);
      alert("Donor submission failed. See console.");
    } finally {
      setLoadingDonor(false);
    }
  };

  const submitPatient = async () => {
    if (!contract) return alert("Connect your wallet first.");
    if (!patient.age) return alert("Please enter patient age.");
    setLoadingPatient(true);
    try {
      const hlaArray = patient.hla ? patient.hla.split(",").map(s => s.trim()).filter(Boolean) : [];
      const tx = await contract.submitPatient(
        Number(patient.age),
        hlaArray,
        patient.bloodGroup,
        Number(patient.kidneySize || 0),
        Number(patient.pra || 0),
        patient.pincode
      );
      await tx.wait();
      setPatientSaved(true);
      setMatchResult("✅ Patient saved on-chain");
    } catch (err) {
      console.error("submitPatient:", err);
      alert("Patient submission failed. See console.");
    } finally {
      setLoadingPatient(false);
    }
  };

  const runMatch = async () => {
    if (!contract) return alert("Connect your wallet first.");
    setLoadingMatch(true);
    try {
      const scoreValue = await contract.viewScore();
      setScore(scoreValue.toString());
      const tx = await contract.matchNow();
      const receipt = await tx.wait();
      const matchedEvent = receipt.logs.find(log => log.topics[0] === contract.interface.getEventTopic("Matched"));
      const notMatchedEvent = receipt.logs.find(log => log.topics[0] === contract.interface.getEventTopic("NotMatched"));
      if (matchedEvent) setMatchResult("✅ Match Found");
      else if (notMatchedEvent) setMatchResult("❌ No Match Found");
      else setMatchResult("❌ Unknown Result");
    } catch (err) {
      console.error("runMatch:", err);
      setMatchResult("❌ Match execution error");
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <div className="page-background">
      <div className="container">
        <div className="inner-shim" />

        <div className="header-row">
          <h2 className="title">Indian Kidney Exchange Program</h2>
          <p className="status">{status}</p>
        </div>

        <div className="grid">
          <section className="card">
            <h3>Donor Details</h3>
            {Object.keys(donor).map(key => (
              <label key={key}>
                {key.toUpperCase()}
                <input placeholder={key} value={donor[key]} onChange={e => setDonor({ ...donor, [key]: e.target.value })} />
              </label>
            ))}

            <button onClick={submitDonor} className={`save-btn ${donorSaved ? 'saved' : ''}`} disabled={loadingDonor}>
              {loadingDonor ? 'Saving...' : donorSaved ? '✅ Donor Saved' : 'Submit Donor'}
            </button>
          </section>

          <section className="card">
            <h3>Patient Details</h3>
            {Object.keys(patient).map(key => (
              <label key={key}>
                {key.toUpperCase()}
                <input placeholder={key} value={patient[key]} onChange={e => setPatient({ ...patient, [key]: e.target.value })} />
              </label>
            ))}

            <button onClick={submitPatient} className={`save-btn ${patientSaved ? 'saved' : ''}`} disabled={loadingPatient}>
              {loadingPatient ? 'Saving...' : patientSaved ? '✅ Patient Saved' : 'Submit Patient'}
            </button>
          </section>

          <section className="card match-card">
            <h3>Run Matching</h3>
            <button onClick={runMatch} className="primary" disabled={loadingMatch}>
              {loadingMatch ? 'Running...' : 'Run Match'}
            </button>

            <p className="match-result">{matchResult}</p>
            {score && <p className="score">🔬 Compatibility Score: {score}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  return entered ? <MainApp /> : <Landing onEnter={() => setEntered(true)} />;
}