import { 
    IsNotEmpty, 
    IsString, 
    IsEnum, 
    IsOptional, 
    IsNumber, 
    IsDateString 
  } from 'class-validator';
  
  export enum UnidadeTipo {
    Hospital = 'Hospital',
    UPA = 'UPA',
    UBS = 'UBS'
  }
  
  export interface IUnidade {
    id?: number;
    nome: string;
    tipo: UnidadeTipo;
    endereco: string;
    telefone?: string;
    capacidade_leitos?: number;
    capacidade_atendimentos_diarios?: number;
    syncStatus?: 'pending' | 'synced' | 'error';
    updatedAt?: Date;
  }
  
  export class Unidade implements IUnidade {
    id?: number;
  
    @IsNotEmpty({ message: 'O nome é obrigatório.' })
    @IsString()
    nome: string;
  
    @IsNotEmpty({ message: 'O tipo é obrigatório.' })
    @IsEnum(UnidadeTipo, { message: 'Tipo inválido. Use "Hospital", "UPA" ou "UBS".' })
    tipo: UnidadeTipo;
  
    @IsNotEmpty({ message: 'O endereço é obrigatório.' })
    @IsString()
    endereco: string;
  
    @IsOptional()
    @IsString()
    telefone?: string;
  
    @IsOptional()
    @IsNumber()
    capacidade_leitos?: number;
  
    @IsOptional()
    @IsNumber()
    capacidade_atendimentos_diarios?: number;
  
    @IsOptional()
    @IsString()
    syncStatus?: 'pending' | 'synced' | 'error';
  
    @IsOptional()
    @IsDateString()
    updatedAt?: Date;
  
    constructor({
      id,
      nome,
      tipo,
      endereco,
      telefone,
      capacidade_leitos,
      capacidade_atendimentos_diarios,
      syncStatus = 'synced',
      updatedAt = new Date(),
    }: IUnidade) {
      this.id = id;
      this.nome = nome;
      this.tipo = tipo;
      this.endereco = endereco;
      this.telefone = telefone;
      this.capacidade_leitos = capacidade_leitos;
      this.capacidade_atendimentos_diarios = capacidade_atendimentos_diarios;
      this.syncStatus = syncStatus;
      this.updatedAt = updatedAt;
    }
  }
  