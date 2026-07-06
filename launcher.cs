using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;

class Program {
    static void Main() {
        string appDir = AppDomain.CurrentDomain.BaseDirectory;
        string nodeExe = Path.Combine(appDir, "bin", "node.exe");
        string serverJs = Path.Combine(appDir, "server.js");

        if (!File.Exists(serverJs)) {
            MessageBox.Show("Loi: Khong tim thay server.js trong thu muc local!\nVui long dam bao ban da giai nen dung cau truc thu muc.", "TechProject Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        string nodePath = File.Exists(nodeExe) ? nodeExe : "node";

        // 1. Khoi chay Next.js server chay ngam (an hoan toan cua so console den)
        ProcessStartInfo nodeStartInfo = new ProcessStartInfo();
        nodeStartInfo.FileName = nodePath;
        nodeStartInfo.Arguments = "\"" + serverJs + "\"";
        nodeStartInfo.WorkingDirectory = appDir;
        nodeStartInfo.CreateNoWindow = true;
        nodeStartInfo.UseShellExecute = false;
        nodeStartInfo.WindowStyle = ProcessWindowStyle.Hidden;
        nodeStartInfo.EnvironmentVariables["PORT"] = "3000";
        nodeStartInfo.EnvironmentVariables["NODE_ENV"] = "production";
        nodeStartInfo.EnvironmentVariables["HOSTNAME"] = "127.0.0.1";

        Process nodeProcess = new Process();
        nodeProcess.StartInfo = nodeStartInfo;
        
        try {
            nodeProcess.Start();
        } catch (Exception ex) {
            MessageBox.Show("Khong the khoi chay may chu TechProject: " + ex.Message, "TechProject Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        // Cho server Next.js khoi dong trong 1.8 giay
        Thread.Sleep(1800);

        // 2. Khoi chay Microsoft Edge o che do App Mode ( Chromium Window doc lap, khong co thanh URL )
        string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
        if (!File.Exists(edgePath)) {
            edgePath = "msedge.exe"; // Fallback neu nguoi dung cai o duong dan khac
        }

        string userProfileDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TechProjectProfile");
        
        ProcessStartInfo edgeStartInfo = new ProcessStartInfo();
        edgeStartInfo.FileName = edgePath;
        edgeStartInfo.Arguments = "--app=http://localhost:3000 --user-data-dir=\"" + userProfileDir + "\"";
        
        Process edgeProcess = new Process();
        edgeProcess.StartInfo = edgeStartInfo;

        try {
            edgeProcess.Start();
        } catch (Exception) {
            // Neu khong mo duoc Edge, thu mo bang trinh duyet mac dinh
            try {
                Process.Start("http://localhost:3000");
            } catch {
                MessageBox.Show("Khong the tu dong mo giao dien. Vui long truy cap http://localhost:3000 bang trinh duyet.", "TechProject Info");
            }
            nodeProcess.WaitForExit();
            return;
        }

        // 3. Cho cho den khi cua so ung dung Edge App Mode bi dong
        edgeProcess.WaitForExit();

        // 4. Khi nguoi dung dong cua so ung dung -> tu dong kill sach se tien trinh server node.exe chay ngam
        try {
            if (!nodeProcess.HasExited) {
                nodeProcess.Kill();
            }
        } catch {}
    }
}
