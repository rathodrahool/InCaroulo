import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ScrapedData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @Column('text')
    content: string;
}
