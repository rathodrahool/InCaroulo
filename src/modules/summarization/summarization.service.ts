import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { ScrapedData } from '../scraper/entities/scraper.entity';
import { Repository } from 'typeorm';
import { ProcessDataDto } from '../dashboard/dto/process-data-dto';

@Injectable()
export class SummarizationService {
    private genAI: GoogleGenerativeAI;

    constructor(
        @InjectRepository(ScrapedData)
        private readonly scrapedDataRepository: Repository<ScrapedData>,
    ) {
        // Initialize the Google Generative AI SDK with the API key
        this.genAI = new GoogleGenerativeAI('AIzaSyBnmZ1CenwfcoeWklQZtdMP8xagQ56xxDo');
    }

    // Summarize the content using the Gemini AI model
    async summarizeContent(data: ProcessDataDto): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
            });

            // Ensure all inputs from the DTO are incorporated
            const prompt = `Use the provided content to draft a concise, engaging, and professional email addressed to the ${data.label} of the organization. The email should include the following:
    
            Subject Line: Craft a compelling subject line that grabs attention, such as:
                “Inspired by Your Vision and Leadership”
                “A Note of Appreciation for [Company Name: ${data.content}]’s Mission”
    
            Opening Paragraph:
                Start with a warm greeting and introduction (e.g., “Dear ${data.label} ${data.name}, as a keen follower of ${data.content}, I felt compelled to reach out.”).
                Mention how you came across their website or work and why you felt inspired.
    
            Body of the Email:
                Highlight specific aspects of their mission or vision that resonate with you (use details from the input content).
                Appreciate a unique feature or initiative their organization is driving.
                Acknowledge the positive impact they are creating in their field or community.
    
            Closing Paragraph:
                Express genuine gratitude for their work and leadership.
                End with a forward-looking statement or offer, such as hoping to see more of their success or collaborating in some capacity.
                Include a polite sign-off (e.g., “With admiration and best regards,”).
    
            Call-to-Action (Optional): If appropriate, add a soft CTA, like asking for a brief meeting or sharing your thoughts further: here is input:\n${data.content}`;

            const result = await model.generateContent(prompt);

            return result.response.text();
        } catch (error) {
            throw new HttpException('Error summarizing content', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
