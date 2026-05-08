import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from './category.model';

const GRAPHQL_URL = '/graphql';
const CATEGORY_FIELDS = `id title description isDefault`;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categories: Category[] = [];
  private categoriesUpdated = new Subject<Category[]>();

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  getCategories(): Category[] {
    return [...this.categories];
  }

  getCategoryUpdateListener() {
    return this.categoriesUpdated.asObservable();
  }

  loadCategories() {
    const query = `query { categories { ${CATEGORY_FIELDS} } }`;
    this.gql<{ categories: Category[] }>(query).subscribe((data) => {
      this.categories = data.categories;
      this.categoriesUpdated.next([...this.categories]);
    });
  }

  createCategory(title: string, description?: string) {
    const mutation = `
      mutation CreateCategory($input: CategoryInput!) {
        createCategory(input: $input) { ${CATEGORY_FIELDS} }
      }`;
    this.gql(mutation, { input: { title, description } }).subscribe(() => this.loadCategories());
  }

  deleteCategory(id: string) {
    const mutation = `
      mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) }`;
    this.gql(mutation, { id }).subscribe(() => this.loadCategories());
  }

  private gql<T = any>(query: string, variables?: object) {
    return this.http
      .post<{ data: T }>(GRAPHQL_URL, { query, variables })
      .pipe(map((res) => res.data));
  }
}
