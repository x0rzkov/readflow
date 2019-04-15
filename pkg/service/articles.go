package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	readability "github.com/go-shiori/go-readability"

	"github.com/ncarlier/readflow/pkg/event"
	"github.com/ncarlier/readflow/pkg/model"
)

// CreateArticles creates new articles
func (reg *Registry) CreateArticles(ctx context.Context, data []model.ArticleForm) (*model.Articles, error) {
	uid := getCurrentUserFromContext(ctx)
	result := model.Articles{}
	for _, art := range data {
		builder := model.NewArticleBuilder()
		article := builder.UserID(
			uid,
		).Form(&art).Build()

		// TODO validate article!
		// if category, validate that the category belongs to the user

		if article.CategoryID == nil {
			// Process article by the rule engine
			if err := reg.ProcessArticleByRuleEngine(ctx, article); err != nil {
				result.Errors = append(result.Errors, err)
				reg.logger.Info().Err(err).Uint(
					"uid", uid,
				).Str("title", art.Title).Msg("unable to create article")
				continue
			}
		}

		if article.URL != nil && (article.Image == nil || article.Text == nil || article.HTML == nil) {
			// Fetch original article to extract missing attributes
			if err := reg.HydrateArticle(ctx, article); err != nil {
				reg.logger.Info().Err(err).Uint(
					"uid", uid,
				).Str("title", art.Title).Msg("unable to fetch original article")
				// continue
			}
		}

		reg.logger.Debug().Uint(
			"uid", uid,
		).Str("title", article.Title).Msg("creating article...")
		article, err := reg.db.CreateOrUpdateArticle(*article)
		if err != nil {
			result.Errors = append(result.Errors, err)
			reg.logger.Info().Err(err).Uint(
				"uid", uid,
			).Str("title", art.Title).Msg("unable to create article")
		} else {
			result.Articles = append(result.Articles, article)
			reg.logger.Info().Uint(
				"uid", uid,
			).Str("title", article.Title).Uint("id", *article.ID).Msg("article created")
			event.Emit(event.CreateArticle, *article)
		}
	}
	var err error
	if len(result.Errors) > 0 {
		err = fmt.Errorf("Errors when creating articles")
	}
	return &result, err
}

// GetArticles get articles
func (reg *Registry) GetArticles(ctx context.Context, req model.ArticlesPageRequest) (*model.ArticlesPageResponse, error) {
	uid := getCurrentUserFromContext(ctx)

	result, err := reg.db.GetPaginatedArticlesByUserID(uid, req)
	if err != nil {
		reg.logger.Info().Err(err).Uint(
			"uid", uid,
		).Msg("unable to get articles")
		return nil, err
	}
	return result, nil
}

// GetArticle get article
func (reg *Registry) GetArticle(ctx context.Context, id uint) (*model.Article, error) {
	uid := getCurrentUserFromContext(ctx)

	article, err := reg.db.GetArticleByID(id)
	if err != nil || article == nil || article.UserID != uid {
		if err == nil {
			err = errors.New("article not found")
		}
		reg.logger.Debug().Err(err).Uint(
			"uid", uid,
		).Uint("id", id).Msg("unable to get article")
		return nil, err
	}

	return article, nil
}

// UpdateArticleStatus update article status
func (reg *Registry) UpdateArticleStatus(ctx context.Context, id uint, status string) (*model.Article, error) {
	uid := getCurrentUserFromContext(ctx)

	article, err := reg.GetArticle(ctx, id)
	if err != nil {
		return nil, err
	}

	article.Status = status
	article, err = reg.db.CreateOrUpdateArticle(*article)
	if err != nil {
		reg.logger.Info().Err(err).Uint(
			"uid", uid,
		).Uint("id", id).Msg("unable to update article")
		return nil, err
	}
	// TODO maybe too verbose... debug level is maybe an option here
	reg.logger.Info().Uint(
		"uid", uid,
	).Uint("id", *article.ID).Str("status", article.Status).Msg("article status updated")

	return article, nil
}

// MarkAllArticlesAsRead set status to read for all articles (of a category if provided)
func (reg *Registry) MarkAllArticlesAsRead(ctx context.Context, categoryID *uint) (int64, error) {
	uid := getCurrentUserFromContext(ctx)

	nb, err := reg.db.MarkAllArticlesAsRead(uid, categoryID)
	if err != nil {
		reg.logger.Info().Err(err).Uint(
			"uid", uid,
		).Msg("unable to mark all articles as read")
		return 0, err
	}
	reg.logger.Debug().Uint(
		"uid", uid,
	).Msg("all articles marked as read")

	return nb, nil
}

// HydrateArticle add missimg attributes form original article
func (reg *Registry) HydrateArticle(ctx context.Context, article *model.Article) error {
	art, err := readability.FromURL(*article.URL, 5*time.Second)
	if err != nil {
		return err
	}
	if article.HTML == nil {
		article.HTML = &art.Content
	}
	if article.Title == "" {
		article.Title = art.Title
	}
	article.Text = &art.Excerpt
	article.Image = &art.Image
	// TODO:
	// article.Favicon = &art.Favicon
	// article.Length = art.Length

	return nil
}
