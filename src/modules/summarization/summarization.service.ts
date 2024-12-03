import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class SummarizationService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        // Initialize the Google Generative AI SDK with the API key
        this.genAI = new GoogleGenerativeAI('AIzaSyBnmZ1CenwfcoeWklQZtdMP8xagQ56xxDo');
    }

    // Summarize the content using the Gemini AI model
    async summarizeContent(content: string): Promise<string> {
        try {
            // Specify the Gemini AI model (e.g., gemini-1.5-flash)
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
            });

            // Define the prompt for summarization
            const prompt = `Summarize the following content:\n\n${content}`;

            // Generate the summarized content
            const result = await model.generateContent(prompt);

            // Return the summarized text
            return result.response.text();
        } catch (error) {
            throw new HttpException('Error summarizing content', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
