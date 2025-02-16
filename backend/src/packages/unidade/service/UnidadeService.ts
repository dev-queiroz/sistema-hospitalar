import { supabase } from '../../../config/supabaseClient';
import { Unidade, IUnidade } from '../model/Unidade';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export class UnidadeService {
    /**
     * Valida os dados da unidade usando class-validator.
     */
    private async validarUnidade(unidadeData: IUnidade): Promise<void> {
        const unidadeInstance = plainToInstance(Unidade, unidadeData);
        const errors = await validate(unidadeInstance);
        if (errors.length > 0) {
            const messages = errors
                .map(error => Object.values(error.constraints || {}).join(', '))
                .join('; ');
            throw new Error(`Validação falhou: ${messages}`);
        }
    }

    async criarUnidade(unidadeData: IUnidade): Promise<Unidade> {
        await this.validarUnidade(unidadeData);

        const { data, error } = await supabase
            .from('unidades')
            .insert([{
                nome: unidadeData.nome,
                tipo: unidadeData.tipo,
                endereco: unidadeData.endereco,
                telefone: unidadeData.telefone,
                capacidade_leitos: unidadeData.capacidade_leitos,
                capacidade_atendimentos_diarios: unidadeData.capacidade_atendimentos_diarios,
                sync_status: unidadeData.syncStatus || 'synced',
                updated_at: unidadeData.updatedAt?.toISOString() || new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return new Unidade({
            nome: data?.nome,
            tipo: data?.tipo,
            endereco: data?.endereco,
            telefone: data?.telefone,
            capacidade_leitos: data?.capacidade_leitos,
            capacidade_atendimentos_diarios: data?.capacidade_atendimentos_diarios,
            syncStatus: data?.sync_status,
            updatedAt: new Date(data?.updated_at),
        });
    }


    async listarUnidades(): Promise<Unidade[]> {
        const { data, error } = await supabase
            .from('unidades')
            .select('*');

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((item: any) => new Unidade({
            id: item.id,
            nome: item.nome,
            tipo: item.tipo,
            endereco: item.endereco,
            telefone: item.telefone,
            capacidade_leitos: item.capacidade_leitos,
            capacidade_atendimentos_diarios: item.capacidade_atendimentos_diarios,
            syncStatus: item.sync_status,
            updatedAt: new Date(item.updated_at),
        }));
    }

    async listarUnidadePorId(id: number): Promise<Unidade> {
        const { data, error } = await supabase
            .from('unidades')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return new Unidade({
            id: data?.id,
            nome: data?.nome,
            tipo: data?.tipo,
            endereco: data?.endereco,
            telefone: data?.telefone,
            capacidade_leitos: data?.capacidade_leitos,
            capacidade_atendimentos_diarios: data?.capacidade_atendimentos_diarios,
            syncStatus: data?.sync_status,
            updatedAt: new Date(data?.updated_at),
        });
    }

    async atualizarUnidade(id: number, unidadeData: Partial<IUnidade>): Promise<Unidade> {
        await this.validarUnidade(unidadeData as IUnidade);

        const { data, error } = await supabase
            .from('unidades')
            .update({
                ...unidadeData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return new Unidade({
            id: data?.id,
            nome: data?.nome,
            tipo: data?.tipo,
            endereco: data?.endereco,
            telefone: data?.telefone,
            capacidade_leitos: data?.capacidade_leitos,
            capacidade_atendimentos_diarios: data?.capacidade_atendimentos_diarios,
            syncStatus: data?.sync_status,
            updatedAt: new Date(data?.updated_at),
        });
    }

    async excluirUnidade(id: number): Promise<void> {
        const { error } = await supabase
            .from('unidades')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    }
}
