import apiClient from './index';

export interface PodcastSegment {
    person: string;
    text: string;
    voice_id: string;
    emotion: string;
    speed: number;
    language: string;
}

export interface PodcastDetails {
    segments: PodcastSegment[];
    total_segments: number;
    mind_map?: string;
    parse_error?: string;
    raw_content?: string;
}

export interface PodcastItem {
    podcast_id: string;
    knowledge_item_id: string;
    knowledge_title: string | null;
    estimated_duration: number;
    audio_available: boolean;
    generation_status: string;
    created_at: string;
    completed_at: string | null;
    progress_percentage: number | null;
}

export interface PodcastListResponse {
    total: number;
    podcasts: PodcastItem[];
}

export const getAllPodcasts = async (): Promise<PodcastListResponse> => {
    const response = await apiClient.get('/podcasts/');
    return response.data;
};

export const getPodcastAudio = async (knowledgeItemId: string): Promise<Blob> => {
    const response = await apiClient.get(`/podcasts/${knowledgeItemId}/audio`, {
        responseType: 'blob'
    });
    return response.data;
};

export const getPodcastAudioUrl = (knowledgeItemId: string): string => {
    return `/api/podcasts/${knowledgeItemId}/audio`;
};

export const getPodcastDetails = async (knowledgeItemId: string): Promise<PodcastDetails> => {
    const response = await apiClient.get(`/podcasts/${knowledgeItemId}/details`);
    return response.data;
};

export const shareKnowledge = async (
    knowledgeItemId: string,
    options: { user_ids?: string[]; generate_audio?: boolean; add_intro?: boolean; send_card?: boolean } = {}
): Promise<PodcastDetails> => {
    const payload = {
        user_ids: options.user_ids ?? [],
        generate_audio: options.generate_audio ?? false,
        add_intro: options.add_intro ?? false,
        send_card: options.send_card ?? true,
    };

    const response = await apiClient.post(`/share/knowledge/${knowledgeItemId}`, payload);
    return response.data;
};