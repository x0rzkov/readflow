import React, { useCallback, useEffect, useState } from 'react'
import { useApolloClient } from 'react-apollo-hooks'

import { Category } from '../../categories/models'
import Button from '../../components/Button'
import Loader from '../../components/Loader'
import Panel from '../../components/Panel'
import { GetArticlesResponse } from '../models'
import { GetNbNewArticles } from '../queries'

const NewArticlesLabel = ({ nb }: { nb: number }) => {
  switch (true) {
    case nb > 1:
      return <>View {nb} new articles</>
    case nb === 1:
      return <>View new article</>
    case nb < 0:
      return <>Refresh</>
    default:
      return null
  }
}

interface Props {
  current: number
  category?: Category
  refresh: () => Promise<any>
}

export default ({ current, category, refresh }: Props) => {
  const [loading, setLoading] = useState(false)
  const [nbItems, setNbItems] = useState(0)

  const client = useApolloClient()

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      await refresh()
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const getNbArticlesToRead = async (lastCount: number) => {
    // console.log('getNbArticlesToRead...')
    try {
      const { errors, data } = await client.query<GetArticlesResponse>({
        query: GetNbNewArticles,
        fetchPolicy: 'network-only',
        variables: { category: category ? category.id : undefined }
      })
      if (data) {
        const delta = data.articles.totalCount - lastCount
        setNbItems(delta)
      }
      if (errors) {
        throw new Error(errors[0].message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => getNbArticlesToRead(current), 60000)
    return () => {
      clearInterval(timer)
    }
  }, [current])

  switch (true) {
    case loading:
      return <Loader />
    case nbItems != 0:
      return (
        <Panel style={{ flex: '0 0 auto' }}>
          <Button onClick={reload}>
            <NewArticlesLabel nb={nbItems} />
          </Button>
        </Panel>
      )
    default:
      return null
  }
}
