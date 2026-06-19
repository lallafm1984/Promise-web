import type { PublicResponseGateway } from '@/lib/publicResponses';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { AppointmentMode } from '@/lib/publicCardView';
import type { AppointmentStatus } from '@/lib/responseValidation';

interface AppointmentCardRow {
  id: string;
  owner_id: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  title: string;
  location: string;
}

interface AppointmentCandidateRow {
  id: string;
  starts_at: string;
  ends_at: string;
  sort_order: number;
}

interface RespondentIdRow {
  id: string;
}

export function createSupabasePublicResponseGateway(): PublicResponseGateway {
  const client = getSupabaseAdmin();

  return {
    async getCardByToken(token) {
      const { data: cardData, error: cardError } = await client
        .from('appointment_cards')
        .select('id, owner_id, mode, status, title, location')
        .eq('public_token', token)
        .maybeSingle();

      if (cardError) {
        throw cardError;
      }

      if (!cardData) {
        return null;
      }

      const card = cardData as AppointmentCardRow;
      const { data: candidatesData, error: candidatesError } = await client
        .from('appointment_candidates')
        .select('id, starts_at, ends_at, sort_order')
        .eq('card_id', card.id)
        .order('sort_order', { ascending: true });

      if (candidatesError) {
        throw candidatesError;
      }

      return {
        id: card.id,
        mode: card.mode,
        status: card.status,
        ownerId: card.owner_id,
        title: card.title,
        location: card.location,
        candidates: ((candidatesData ?? []) as AppointmentCandidateRow[]).map((candidate) => ({
          id: candidate.id,
          sortOrder: candidate.sort_order,
          startsAt: candidate.starts_at,
          endsAt: candidate.ends_at,
        })),
      };
    },

    async findRespondentByTokenHash(cardId, responseTokenHash) {
      const { data, error } = await client
        .from('appointment_respondents')
        .select('id')
        .eq('card_id', cardId)
        .eq('response_token_hash', responseTokenHash)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? { id: (data as RespondentIdRow).id } : null;
    },

    async createRespondent(row) {
      const { data, error } = await client
        .from('appointment_respondents')
        .insert({
          card_id: row.cardId,
          display_name: row.displayName,
          comment: row.comment,
          response_token_hash: row.responseTokenHash,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return { id: (data as RespondentIdRow).id };
    },

    async updateRespondent(row) {
      const { error } = await client
        .from('appointment_respondents')
        .update({
          display_name: row.displayName,
          comment: row.comment,
        })
        .eq('id', row.respondentId);

      if (error) {
        throw error;
      }
    },

    async upsertCandidateResponses(rows) {
      const { error } = await client.from('appointment_candidate_responses').upsert(
        rows.map((row) => ({
          respondent_id: row.respondentId,
          candidate_id: row.candidateId,
          choice: row.choice,
        })),
        { onConflict: 'respondent_id,candidate_id' },
      );

      if (error) {
        throw error;
      }
    },

  };
}
