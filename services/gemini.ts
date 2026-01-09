
import { GoogleGenAI } from "@google/genai";
import { Project, CutRecord } from "../types";

// Always initialize GoogleGenAI with a named parameter for the API key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  async analyzeBudget(project: Project, records: CutRecord[]) {
    try {
      const networks = project.networks || [];
      // Calculate full budget totals from networks since they are not direct properties of Project
      const labor_full = networks.reduce((sum, n) => sum + (Number(n.labor_full) || 0), 0);
      const supervise_full = networks.reduce((sum, n) => sum + (Number(n.supervise_full) || 0), 0);
      const transport_full = networks.reduce((sum, n) => sum + (Number(n.transport_full) || 0), 0);
      const misc_full = networks.reduce((sum, n) => sum + (Number(n.misc_full) || 0), 0);

      const prompt = `
        คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์งบประมาณก่อสร้าง (SM2 Control)
        กรุณาวิเคราะห์ข้อมูลโครงการต่อไปนี้:
        โครงการ: ${project.name} (WBS: ${project.wbs})
        ช่าง: ${project.worker}
        งบประมาณเต็ม:
        - ค่าแรง: ${labor_full.toLocaleString()}
        - ควบคุมงาน: ${supervise_full.toLocaleString()}
        - ขนส่ง: ${transport_full.toLocaleString()}
        - เบ็ดเตล็ด: ${misc_full.toLocaleString()}
        เพดานงบที่ตัดได้: ${project.maxBudgetPercent}%

        ประวัติการตัดงบ:
        ${records.map(r => `- ${new Date(r.timestamp).toLocaleDateString()}: ${r.detail} (รวม ${(r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut).toLocaleString()})`).join('\n')}

        ช่วยสรุปสถานะปัจจุบันใน 3-4 ประโยคสั้นๆ ว่าการใช้จ่ายเป็นอย่างไร เหลือวงเงินเท่าไหร่ และมีข้อควรระวังอะไรไหม (ตอบเป็นภาษาไทย)
      `;

      // Use ai.models.generateContent to query GenAI with the model name and prompt directly
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      // Extract generated text from the response object's .text property
      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
    }
  }
};
