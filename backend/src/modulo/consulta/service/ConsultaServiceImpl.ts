import { supabaseClient } from '../../../shared/database/supabase';
import { Consulta, IConsultaService } from '../types/consulta.types';
import { CreateConsultaDTO, UpdateConsultaDTO, ListConsultasParams } from '../dto/consulta.dto';

export class ConsultaServiceImpl implements IConsultaService {
    private supabase = supabaseClient;

    constructor() {}
    
    private handleDatabaseError(error: any, defaultMessage: string): Error {
        console.error('Database error:', error);
        return new Error(error?.message || defaultMessage);
    }

    /**
     * Create a new consultation
     */
    async createConsulta(
        data: CreateConsultaDTO, 
        usuarioId: string
    ): Promise<{ data: Consulta | null; error: Error | null }> {
        try {
            // Validate input data
            const validatedData = CreateConsultaDTO.parse(data);

            // Check if patient exists and is active
            const { data: paciente, error: pacienteError } = await this.supabase
                .from('paciente')
                .select('id')
                .eq('id', validatedData.pacienteId)
                .eq('ativo', true)
                .single();

            if (pacienteError || !paciente) {
                throw new Error('Paciente não encontrado ou inativo');
            }

            // Check if healthcare unit exists
            const { data: unidade, error: unidadeError } = await this.supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', validatedData.unidadeSaudeId)
                .single();

            if (unidadeError || !unidade) {
                throw new Error('Unidade de saúde não encontrada');
            }

            // Create the consultation
            const { data: consulta, error: createError } = await this.supabase
                .from('consulta')
                .insert({
                    paciente_id: validatedData.pacienteId,
                    profissional_id: usuarioId,
                    unidade_saude_id: validatedData.unidadeSaudeId,
                    observacoes: validatedData.observacoes || '',
                    cid10: validatedData.cid10,
                    ativo: true,
                    data_consulta: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) {
                throw this.handleDatabaseError(createError, 'Erro ao criar consulta');
            }

            return { data: consulta as unknown as Consulta, error: null };
        } catch (error) {
            console.error('Error creating consultation:', error);
            return { data: null, error: error instanceof Error ? error : new Error('Erro ao criar consulta') };
        }
    }

    /**
     * Get a consultation by ID
     */
    async getConsulta(
        id: string, 
        usuarioId: string
    ): Promise<{ data: Consulta | null; error: Error | null }> {
        try {
            const { data: consulta, error } = await this.supabase
                .from('consulta')
                .select('*')
                .or(`paciente_id.eq.${usuarioId},profissional_id.eq.${usuarioId}`)
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !consulta) {
                return { 
                    data: null, 
                    error: new Error(error?.message || 'Consulta não encontrada') 
                };
            }

            return { data: consulta as unknown as Consulta, error: null };
        } catch (error) {
            console.error('Error getting consultation:', error);
            return { data: null, error: error instanceof Error ? error : new Error('Erro ao buscar consulta') };
        }
    }

    /**
     * Update a consultation
     */
    async updateConsulta(
        data: UpdateConsultaDTO, 
        usuarioId: string
    ): Promise<{ data: Consulta | null; error: Error | null }> {
        try {
            const validatedData = UpdateConsultaDTO.parse(data);

            // Check if consultation exists and user has permission
            const { data: existing, error: existingError } = await this.getConsulta(validatedData.id, usuarioId);
            if (existingError || !existing) {
                return { data: null, error: existingError || new Error('Consulta não encontrada') };
            }

            // Update the consultation
            const { data: updated, error: updateError } = await this.supabase
                .from('consulta')
                .update({
                    observacoes: validatedData.observacoes,
                    cid10: validatedData.cid10,
                    status: validatedData.status,
                    atualizado_em: new Date().toISOString()
                })
                .eq('id', validatedData.id)
                .select()
                .single();

            if (updateError) {
                throw this.handleDatabaseError(updateError, 'Erro ao atualizar consulta');
            }

            return { data: updated as unknown as Consulta, error: null };
        } catch (error) {
            console.error('Error updating consultation:', error);
            return { data: null, error: error instanceof Error ? error : new Error('Erro ao atualizar consulta') };
        }
    }

    /**
     * Delete a consultation (soft delete)
     */
    async deleteConsulta(
        id: string, 
        usuarioId: string
    ): Promise<{ error: Error | null }> {
        try {
            // Check if consultation exists and user has permission
            const { error: checkError } = await this.getConsulta(id, usuarioId);
            if (checkError) {
                return { error: checkError };
            }

            // Soft delete
            const { error: deleteError } = await this.supabase
                .from('consulta')
                .update({ 
                    ativo: false,
                    atualizado_em: new Date().toISOString()
                })
                .eq('id', id);

            if (deleteError) {
                throw this.handleDatabaseError(deleteError, 'Erro ao excluir consulta');
            }

            return { error: null };
        } catch (error) {
            console.error('Error deleting consultation:', error);
            return { error: error instanceof Error ? error : new Error('Erro ao excluir consulta') };
        }
    }

    /**
     * List consultations with filters
     */
    async listConsultas(
        params: ListConsultasParams,
        usuarioId: string
    ): Promise<{ data: Consulta[]; error: Error | null }> {
        try {
            const { pacienteId, profissionalId, status, dataInicio, dataFim } = params;
            
            // Build the query
            let query = this.supabase
                .from('consulta')
                .select('*')
                .or(`paciente_id.eq.${usuarioId},profissional_id.eq.${usuarioId}`)
                .eq('ativo', true);

            if (pacienteId) {
                query = query.eq('paciente_id', pacienteId);
            }
            
            if (profissionalId) {
                query = query.eq('profissional_id', profissionalId);
            }
            
            if (status) {
                query = query.eq('status', status);
            }
            
            if (dataInicio) {
                query = query.gte('data_consulta', new Date(dataInicio).toISOString());
            }
            
            if (dataFim) {
                // Set to end of day
                const endOfDay = new Date(dataFim);
                endOfDay.setHours(23, 59, 59, 999);
                query = query.lte('data_consulta', endOfDay.toISOString());
            }

            // Add ordering
            query = query.order('data_consulta', { ascending: false });

            const { data: consultas, error } = await query;

            if (error) {
                throw this.handleDatabaseError(error, 'Erro ao buscar consultas');
            }

            return { data: consultas as unknown as Consulta[], error: null };
        } catch (error) {
            console.error('Error listing consultations:', error);
            return { 
                data: [], 
                error: error instanceof Error ? error : new Error('Erro ao listar consultas') 
            };
        }
    }
}
