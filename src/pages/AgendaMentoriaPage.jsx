import SecaoAulasDaTurma from '../components/modules/mentoria/AulasDaTurma'

export default function AgendaMentoriaPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Suas aulas da Mentoria em Grupo, com data, material e vídeo de cada encontro.
      </div>
      <SecaoAulasDaTurma />
    </div>
  )
}
