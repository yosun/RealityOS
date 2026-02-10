
# 💎 RealityOS

![RealityOS Banner](reality-os/public/messy_desk.png)

> **"Spatial Computing OS for the AI Era."**

RealityOS is a next-generation interface that reimagines how we interact with AI. Instead of chat bubbles, it uses a **spatial canvas** where images, text, and data become first-class citizens called **Registers**. 

Users express **Intent** in natural language, and the OS orchestrates **Programs**—dynamic graphs of AI operations (Segmentation, Logic, Generation)—to manipulatre reality in real-time.

## ✨ Key Features

- **Spatial Interface**: A seamless 2D/3D hybrid canvas built with React Three Fiber. Switch views instantly to inspect depth, layer order, and relationships.
- **Register-Based Logic**: Data entities are encapsulated as "Registers" with full provenance tracking. Know exactly where every pixel came from.
- **Visual Programming**: Connect operations (Ops) with wires to create complex processing pipelines.
- **Multimodal Intelligence**: Built-in integration with **Google Gemini 1.5 Pro/Flash** for reasoning and **Fal.ai (SAM3)** for precise segmentation.
- **Graph State Persistence**: Your entire session state is saved as a graph, allowing for resumption and sharing.

## 🏗️ Architecture

RealityOS follows a modern, serverless architecture designed for scalability and performance.

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **3D Engine**: Three.js + React Three Fiber (R3F)
- **State Management**: Zustand (Global Store)
- **Styling**: TailwindCSS + Framer Motion

### Backend (Serverless)
- **Logic**: AWS Lambda (Node.js 20.x) act as secure proxies for AI model inference.
- **Storage**: AWS S3 for persistent state and asset hosting.
- **CDN**: AWS CloudFront for global edge delivery.

### AI Models
- **Reasoning**: Google Gemini 1.5 Pro & Flash
- **Vision**: Fal.ai (Segment Almost Anything Model 3)

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- npm or yarn
- AWS Account (for deployment)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yosun/RealityOS.git
    cd RealityOS/reality-os
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in `reality-os/` with your API keys (see Configuration below).

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## ⚙️ Configuration

Create a `.env` file in the `reality-os` directory.

> **Security Note:** Never commit `.env` to version control.

**Required Keys:**
*   `VITE_FAL_KEY`: API Key for Fal.ai services.
*   `VITE_AWS_ACCESS_KEY_ID`: AWS Access Key.
*   `VITE_AWS_SECRET_ACCESS_KEY`: AWS Secret Key.
*   `VITE_S3_BUCKET_NAME`: Name of your S3 bucket.
*   `VITE_AWS_REGION`: AWS Region (e.g., `us-east-1`).
*   `VITE_LAMBDA_URL`: URL of the deployed Lambda proxy.

## 📦 Deployment

RealityOS is designed for serverless deployment on AWS.

1.  **Deploy Lambda Backend**:
    ```bash
    ./deploy_lambda.sh
    ```
2.  **Deploy Static Frontend**:
    ```bash
    ./deploy_static.sh
    ```

For full details, see [DEPLOY.md](reality-os/DEPLOY.md).

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
