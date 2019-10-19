import React, { useContext } from 'react'
import { useQuery } from 'react-apollo-hooks'
import { RouteComponentProps, withRouter } from 'react-router'

import { GetCategoriesResponse } from '../categories/models'
import { GetCategories } from '../categories/queries'
import LinkIcon from '../components/LinkIcon'
import Loader from '../components/Loader'
import Offline from '../components/Offline'
import UserInfos from '../components/UserInfos'
import { NavbarContext } from '../context/NavbarContext'
import { matchResponse } from '../helpers'
import useOnlineStatus from '../hooks/useOnlineStatus'
import styles from './Navbar.module.css'
import { Link } from 'react-router-dom'

export default withRouter(({ location }: RouteComponentProps) => {
  const { pathname } = location
  const isOnline = useOnlineStatus()
  const { data, error, loading } = useQuery<GetCategoriesResponse>(GetCategories)
  const navbar = useContext(NavbarContext)

  const isCategoryActive = (id?: number) => {
    const _path = `/categories/${id}`
    return !!id && (pathname === _path || pathname.startsWith(`${_path}/`))
  }

  const menuAutoClose = () => {
    if (window.innerWidth <= 767) {
      setTimeout(navbar.close, 300)
    }
  }

  const renderCategories = matchResponse<GetCategoriesResponse>({
    Loading: () => <Loader />,
    Error: err => <span>{err.message}</span>,
    Data: data => (
      <ul>
        {data.categories &&
          data.categories
            .filter(c => c.id !== null)
            .map(category => (
              <li key={`cat-${category.id}`}>
                <LinkIcon
                  as={Link}
                  to={`/categories/${category.id}`}
                  active={isCategoryActive(category.id)}
                  icon="bookmark"
                  onClick={menuAutoClose}
                  badge={category.unread ? category.unread : undefined}
                >
                  {category.title}
                </LinkIcon>
              </li>
            ))}
      </ul>
    ),
    Other: () => <span>Unable to fetch categories!</span>
  })

  let total: number | undefined
  if (data && data.categories) {
    const all = data.categories.find(c => c.title === '_all')
    if (all) {
      total = all.unread
    }
  }

  return (
    <nav id="navbar" className={styles.nav}>
      <ul>
        <li>
          <h1>
            <img src={process.env.PUBLIC_URL + '/logo_white.svg'} />
          </h1>
          {isOnline && <UserInfos />}
          {!isOnline && <Offline />}
        </li>
        <li className={styles.links}>
          <span>Articles</span>
          <ul>
            <li>
              <LinkIcon
                as={Link}
                to="/unread"
                icon="view_list"
                badge={total}
                active={pathname.startsWith('/unread')}
                onClick={menuAutoClose}
              >
                Articles to read
              </LinkIcon>
            </li>
            <li>
              <LinkIcon
                as={Link}
                to="/offline"
                icon="signal_wifi_off"
                active={pathname.startsWith('/offline')}
                onClick={menuAutoClose}
              >
                Offline articles
              </LinkIcon>
            </li>
            <li>
              <LinkIcon
                as={Link}
                to="/history"
                icon="history"
                active={pathname.startsWith('/history')}
                onClick={menuAutoClose}
              >
                History
              </LinkIcon>
            </li>
          </ul>
        </li>
        <li className={styles.links}>
          <span>Categories</span>
          {isOnline && renderCategories(data, error, loading)}
        </li>
        <li className={styles.links}>
          <ul>
            <li>
              <LinkIcon
                id="navbar-link-settings"
                as={Link}
                to="/settings"
                icon="settings"
                onClick={menuAutoClose}
                active={pathname.startsWith('/settings')}
              >
                Settings
              </LinkIcon>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  )
})