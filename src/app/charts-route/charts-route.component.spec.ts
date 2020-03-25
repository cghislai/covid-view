import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartsRouteComponent } from './charts-route.component';

describe('ChartsRouteComponent', () => {
  let component: ChartsRouteComponent;
  let fixture: ComponentFixture<ChartsRouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartsRouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartsRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
