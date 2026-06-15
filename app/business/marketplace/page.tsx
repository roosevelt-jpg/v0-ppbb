'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MessageCircle, Send } from 'lucide-react'

export default function Marketplace() {
  const { user } = useAuth()
  const router = useRouter()
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMember, setSelectedMember] = React.useState<any>(null)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
      router.push('/login')
      return
    }

    // Simulated member data
    setMembers([
      {
        id: '1',
        name: 'Ahmed Mohammed',
        role: 'member',
        profession: 'Software Developer',
        skills: ['React', 'Node.js', 'TypeScript'],
      },
      {
        id: '2',
        name: 'Fatima Al Mansouri',
        role: 'member',
        profession: 'Marketing Specialist',
        skills: ['Digital Marketing', 'Social Media', 'Content Writing'],
      },
      {
        id: '3',
        name: 'Mohammed Hassan',
        role: 'volunteer',
        profession: 'Graphic Designer',
        skills: ['UI/UX Design', 'Branding', 'Illustration'],
      },
    ])
    setLoading(false)
  }, [user, router])

  const handleSendMessage = () => {
    if (message.trim() && selectedMember) {
      console.log(`[v0] Message sent to ${selectedMember.name}: ${message}`)
      alert('Message sent successfully!')
      setMessage('')
    }
  }

  if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Marketplace & Networking
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Connect with community members and potential partners
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {loading ? (
          <div className="text-center py-8">Loading marketplace...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Members List */}
            <div className="lg:col-span-1">
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Community Members
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedMember?.id === member.id
                            ? '#f0f0f0'
                            : '#ffffff',
                        border:
                          selectedMember?.id === member.id
                            ? '2px solid #111111'
                            : '1px solid #e4e1da',
                      }}
                    >
                      <p style={{ color: '#111111', fontWeight: 600 }}>{member.name}</p>
                      <p style={{ color: '#888888', fontSize: '12px' }}>
                        {member.profession}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Member Details & Message */}
            <div className="lg:col-span-2">
              {selectedMember ? (
                <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                  <h3 style={{ color: '#111111', fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                    {selectedMember.name}
                  </h3>

                  {/* Member Info */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                        Role
                      </p>
                      <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                        {selectedMember.role}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                        Profession
                      </p>
                      <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                        {selectedMember.profession}
                      </p>
                    </div>
                    {selectedMember.skills && selectedMember.skills.length > 0 && (
                      <div>
                        <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {selectedMember.skills.map((skill: string) => (
                            <span
                              key={skill}
                              style={{
                                backgroundColor: '#f0f0f0',
                                color: '#111111',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Box */}
                  <div style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Send Message
                    </p>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e4e1da',
                        borderRadius: '8px',
                        color: '#111111',
                        fontFamily: 'inherit',
                        marginBottom: '12px',
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      style={{
                        backgroundColor: '#111111',
                        color: '#ffffff',
                      }}
                      className="flex items-center gap-2 w-full justify-center"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
                  <Users style={{ color: '#888888', opacity: 0.3 }} className="w-12 h-12 mx-auto mb-4" />
                  <p style={{ color: '#888888' }}>Select a member to start connecting</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
