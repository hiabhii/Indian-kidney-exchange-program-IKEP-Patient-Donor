// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Indian Kidney Exchange Program - One-to-One Matching Contract
contract IKEP_SingleMatch {
    address public hospital;
    bool public accessLocked = false;

    constructor() {
        hospital = msg.sender;
    }

    modifier onlyHospital() {
        require(!accessLocked || msg.sender == hospital, "Access restricted to hospital");
        _;
    }

    struct Donor {
        uint age;
        string bloodGroup;
        string[] hla;
        uint kidneySize;
        string pincode;
    }

    struct Patient {
        uint age;
        string bloodGroup;
        string[] hla;
        uint kidneySize;
        uint pra;
        string pincode;
    }

    Donor public donor;
    Patient public patient;

    bool public donorSubmitted = false;
    bool public patientSubmitted = false;

    event DonorSubmitted();
    event PatientSubmitted();
    event Matched(uint score);
    event NotMatched(uint score);
    event ScoreCalculated(uint score);

    function toggleAccessLock(bool _lock) external {
        require(msg.sender == hospital, "Only hospital can lock access");
        accessLocked = _lock;
    }

    function submitDonor(
        uint age,
        string[] memory hla,
        string memory bloodGroup,
        uint kidneySize,
        string memory pincode
    ) external onlyHospital {
        require(hla.length > 0, "HLA typing required");
        donor = Donor(age, bloodGroup, hla, kidneySize, pincode);
        donorSubmitted = true;
        emit DonorSubmitted();
    }

    function submitPatient(
        uint age,
        string[] memory hla,
        string memory bloodGroup,
        uint kidneySize,
        uint pra,
        string memory pincode
    ) external onlyHospital {
        require(hla.length > 0, "HLA typing required");
       require(pra <= 100, "PRA must be 0-100");
        patient = Patient(age, bloodGroup, hla, kidneySize, pra, pincode);
        patientSubmitted = true;
        emit PatientSubmitted();
    }

    function matchNow() external onlyHospital returns (bool) {
        require(donorSubmitted && patientSubmitted, "Both records must be submitted");

        uint score = computeCompatibilityScore();
        emit ScoreCalculated(score);

        if (score >= 18) {
            emit Matched(score);
            return true;
        } else {
            emit NotMatched(score);
            return false;
        }
    }

    function viewScore() external view returns (uint) {
        require(donorSubmitted && patientSubmitted, "Both records must be submitted");
        return computeCompatibilityScore();
    }

    function computeCompatibilityScore() public view returns (uint score) {
        require(donorSubmitted && patientSubmitted, "Both records must be submitted");
        score = 0;

        // 1. ABO Compatibility (6 pts)
        if (isABOCompatible(donor.bloodGroup, patient.bloodGroup)) {
            score += 6;
        }

        // 2. Age Score (up to 6 pts)
        int ageDiff = int(donor.age) - int(patient.age);
        if (ageDiff < 0) {
            score += 6;
        } else if (ageDiff <= 40) {
            uint deduction = uint((ageDiff * 15) / 100);
            score += (deduction >= 6) ? 0 : (6 - deduction);
        }

        // 3. Kidney Size Score (up to 6 pts)
        uint sizeDiff = donor.kidneySize > patient.kidneySize
            ? donor.kidneySize - patient.kidneySize
            : patient.kidneySize - donor.kidneySize;
        if (sizeDiff <= 3) {
            score += (6 - sizeDiff);
        }

        // 4. Pincode Match (6 pts)
        if (keccak256(bytes(donor.pincode)) == keccak256(bytes(patient.pincode))) {
            score += 6;
        }

        // 5. HLA Matches (up to 6 pts)
        uint hlaMatches = 0;
        for (uint i = 0; i < donor.hla.length && hlaMatches < 6; i++) {
            for (uint j = 0; j < patient.hla.length && hlaMatches < 6; j++) {
                if (keccak256(bytes(donor.hla[i])) == keccak256(bytes(patient.hla[j]))) {
                    hlaMatches++;
                }
            }
        }
        score += hlaMatches;
    }

    function isABOCompatible(string memory donorBG, string memory patientBG) internal pure returns (bool) {
        bytes32 d = keccak256(bytes(donorBG));
        bytes32 p = keccak256(bytes(patientBG));

        if (d == keccak256("O")) return true;
        if (d == p) return true;
        if ((d == keccak256("A") && p == keccak256("AB")) ||
            (d == keccak256("B") && p == keccak256("AB"))) return true;
        return false;
    }

    function reset() external onlyHospital {
        donorSubmitted = false;
        patientSubmitted = false;
        delete donor;
        delete patient;
    }
}