'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ContactInfo = {
  pageTitle: string
  pageSubtitle: string
  announcementTitle: string
  announcementBody: string
  supportEmail: string
  supportPhone: string
  supportAddress: string
  supportHours: string
  faqTitle: string
  faqBody: string
}

const defaultContactInfo: ContactInfo = {
  pageTitle: 'Contact LocalCart',
  pageSubtitle: 'We are here to help customers and vendors with fast, friendly support.',
  announcementTitle: 'Need quick assistance?',
  announcementBody:
    'Share your issue with account details, order number, or vendor name so our support team can resolve it quickly.',
  supportEmail: 'support@localcart.com',
  supportPhone: '+1-800-LOCALCART',
  supportAddress: 'LocalCart Support Center',
  supportHours: 'Mon-Sat, 9:00 AM - 6:00 PM',
  faqTitle: 'Before you contact us',
  faqBody:
    'Most order updates are available in your dashboard under Orders. Vendors can track approvals and policy updates in Vendor Dashboard.',
}

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo)

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const response = await apiClient.get<ContactInfo>('/public/contact-info')
        setContactInfo({ ...defaultContactInfo, ...response })
      } catch {
        setContactInfo(defaultContactInfo)
      }
    }

    loadContactInfo()
  }, [])

  const faqItems = useMemo(
    () =>
      contactInfo.faqBody
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [contactInfo.faqBody]
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{contactInfo.pageTitle}</h1>
        <p className="text-lg text-slate-600">{contactInfo.pageSubtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contactInfo.announcementTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-slate-700 leading-relaxed">{contactInfo.announcementBody}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Email</CardTitle></CardHeader>
          <CardContent>
            <a className="text-slate-700 font-medium hover:underline" href={`mailto:${contactInfo.supportEmail}`}>
              {contactInfo.supportEmail}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Phone</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-700 font-medium">{contactInfo.supportPhone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Support Center</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-700 font-medium">{contactInfo.supportAddress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Support Hours</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-700 font-medium">{contactInfo.supportHours}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contactInfo.faqTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {faqItems.length > 1 ? (
            <ul className="space-y-2 text-slate-700">
              {faqItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span className="font-semibold text-slate-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-700 whitespace-pre-line">{contactInfo.faqBody}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
