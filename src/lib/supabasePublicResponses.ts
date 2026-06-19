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

interface AppointmentIdRow {
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

    async confirmDirectAcceptedCard(input) {
      const { data: updatedCard, error: updateCardError } = await client
        .from('appointment_cards')
        .update({
          status: 'CONFIRMED',
          selected_candidate_id: input.candidate.id,
        })
        .eq('id', input.cardId)
        .eq('owner_id', input.ownerId)
        .eq('mode', 'DIRECT')
        .eq('status', 'PENDING')
        .select('id')
        .maybeSingle();

      if (updateCardError) {
        throw updateCardError;
      }

      if (!updatedCard) {
        return false;
      }

      const appointmentValues = {
        owner_id: input.ownerId,
        card_id: input.cardId,
        candidate_id: input.candidate.id,
        title: input.title,
        location: input.location,
        starts_at: input.candidate.startsAt,
        ends_at: input.candidate.endsAt,
        color_key: 'mint',
      };
      const { data: existingAppointment, error: existingAppointmentError } = await client
        .from('appointments')
        .select('id')
        .eq('owner_id', input.ownerId)
        .eq('card_id', input.cardId)
        .limit(1)
        .maybeSingle();

      if (existingAppointmentError) {
        throw existingAppointmentError;
      }

      const existingAppointmentId = (existingAppointment as AppointmentIdRow | null)?.id;

      if (existingAppointmentId) {
        const { error: updateAppointmentError } = await client
          .from('appointments')
          .update(appointmentValues)
          .eq('id', existingAppointmentId)
          .eq('owner_id', input.ownerId);

        if (updateAppointmentError) {
          throw updateAppointmentError;
        }
        return true;
      }

      const { error: insertAppointmentError } = await client.from('appointments').insert(appointmentValues);

      if (insertAppointmentError) {
        throw insertAppointmentError;
      }

      return true;
    },

    async declineDirectCard(input) {
      const { data: updatedCard, error: updateCardError } = await client
        .from('appointment_cards')
        .update({
          status: 'DECLINED',
        })
        .eq('id', input.cardId)
        .eq('owner_id', input.ownerId)
        .eq('mode', 'DIRECT')
        .eq('status', 'PENDING')
        .select('id')
        .maybeSingle();

      if (updateCardError) {
        throw updateCardError;
      }

      if (!updatedCard) {
        return false;
      }

      const { error: deleteAppointmentError } = await client
        .from('appointments')
        .delete()
        .eq('owner_id', input.ownerId)
        .eq('card_id', input.cardId);

      if (deleteAppointmentError) {
        throw deleteAppointmentError;
      }

      return true;
    },
  };
}
