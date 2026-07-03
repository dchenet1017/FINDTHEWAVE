import { useState } from 'react'
import { Radio, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useNearbyGoOutUsers, useSendInvite, type NearbyGoOutUser } from '@/hooks/useBusinessInvites'

export default function GoOutQueuePage() {
  const { data, isLoading } = useNearbyGoOutUsers(15, true)
  const sendMut = useSendInvite()
  const users = data?.items ?? []

  const [target, setTarget] = useState<NearbyGoOutUser | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const openInvite = (u: NearbyGoOutUser) => {
    setTarget(u)
    setTitle('')
    setMessage('')
  }

  const submit = () => {
    if (!target || !title.trim() || !message.trim()) return
    sendMut.mutate(
      { userId: target.userId, title: title.trim(), message: message.trim(), goOutStatusId: target.goOutStatusId },
      { onSuccess: () => setTarget(null) }
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-white">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Radio className="h-6 w-6 text-success" />
          Go Out Queue
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          People nearby who are available right now. Send them a deal to bring them in.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-dark-card/50 px-6 py-20 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-white">No one nearby right now</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            When users tap "Go Out" near your business, they'll show up here so you can send them a deal.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const name = [u.user.firstName, u.user.lastName].filter(Boolean).join(' ') || 'Guest'
            return (
              <li
                key={u.goOutStatusId}
                className="flex items-center gap-3 rounded-xl border border-gray-800 bg-dark-card p-4"
              >
                <Avatar src={u.user.avatar || undefined} fallback={name[0] || '?'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-gray-500">{u.distanceMiles} mi away</p>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Active
                </Badge>
                <Button size="sm" onClick={() => openInvite(u)}>
                  <Send className="mr-2 h-3.5 w-3.5" />
                  Send Invite
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-title">Title</Label>
              <Input
                id="invite-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Free appetizer tonight!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-message">Message</Label>
              <Textarea
                id="invite-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Come on by, first round on us."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={sendMut.isPending}
              disabled={!title.trim() || !message.trim()}
              onClick={submit}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
