import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Category } from '../category.model';
import { CategoryService } from '../category.service';

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit, OnDestroy {
  @ViewChild(FormGroupDirective) formDir!: FormGroupDirective;
  categories: Category[] = [];
  form!: FormGroup;
  private sub!: Subscription;

  constructor(private categoryService: CategoryService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(1)]),
      description: new FormControl(''),
    });

    this.sub = this.categoryService.getCategoryUpdateListener().subscribe((cats) => {
      this.categories = cats;
      this.cdr.detectChanges();
    });
    this.categoryService.loadCategories();
  }

  onCreate() {
    if (this.form.invalid) return;
    const { title, description } = this.form.value;
    this.categoryService.createCategory(title.trim(), description?.trim() || undefined);
    this.formDir.resetForm();
  }

  onDelete(id: string) {
    this.categoryService.deleteCategory(id);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
