# DVSA Slot Monitor

## Introduction
This project provides a fully-automated monitoring tool to check for **driving test slot availability** on DVSA UK website. It is focused on **9 test centers in London**:
- Loughton
- Hounslow
- Mill Hill
- Toddington
- Wood Green
- Yelverton
- Morden
- Erith
- Goodmayes

---

## Features
- **Automated Monitoring**: The script continuously checks slot availability for the specified London test centers.
- **Notifications**: Alerts via browser push notifications and sound when a slot is found.
- **Multi-Platform Support**: Works on Chrome Android (mobile) and Chrome Desktop.
- **Secure & Error-Free**: Developed with best practices to ensure reliability and security.

---

## Setup Guide
### Prerequisites
- Make sure you have **Google Chrome** installed (supports both desktop and mobile).
- Node.js installed on a local machine (for running the script).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ForexKailash/Dvsa-copilot-.git
   cd Dvsa-copilot-
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

### Configuration
1. In the `config` folder, locate `centers.json`. Add the DVSA test center IDs for the 9 centers being monitored. **(IDs must be retrieved from the DVSA website)**.
2. Set notification preferences in the `config/prefs.json` file:
   - Browser Notifications
   - Sound Alert
   
---

### Running the Monitor
Run the script using:
   ```bash
   node monitor.js
   ```
   The script will now continuously check for available slots.

---

### Notes
- Ensure you have valid **DVSA login credentials** stored securely in the designated secure file (instructions to be added).
- Please ensure this use complies with DVSA terms and conditions.

---

## Contribution
Feel free to contribute to this project. Submit issues or pull requests!

---

## License
This project uses the MIT license.