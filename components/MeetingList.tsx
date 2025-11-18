import { format } from 'date-fns'

export interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  attendees?: string | null
}

export default function MeetingList({ meetings }: { meetings: Meeting[] }) {
  if (!meetings || meetings.length === 0) {
    return <div className="py-4 text-sm text-purple-light">No meetings scheduled today.</div>
  }
  return (
    <ul className="divide-y divide-graphite-light">
      {meetings.map((meeting) => (
        <li
          key={meeting.id}
          className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{meeting.title}</p>
            <p className="text-xs text-purple-light">
              {format(new Date(meeting.start_time), 'HH:mm')} -{' '}
              {format(new Date(meeting.end_time), 'HH:mm')}
            </p>
          </div>
          <div className="text-xs text-graphite-light">{meeting.attendees}</div>
        </li>
      ))}
    </ul>
  )
}