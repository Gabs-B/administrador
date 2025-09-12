import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CyberwowComponent } from './cyberwow.component';

describe('CyberwowComponent', () => {
  let component: CyberwowComponent;
  let fixture: ComponentFixture<CyberwowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CyberwowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CyberwowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
