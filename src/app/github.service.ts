import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GithubService {

  constructor(
    private httpClient: HttpClient
  ) {
  }

  getRawBlobContentPath(path: string): string {
    return `https://raw.githubusercontent.com/${path}`;
  }

  getRawBlobContentUrl$(url: string): Observable<string> {
    return this.httpClient.get(url, {
      observe: 'response',
      responseType: 'text',
    }).pipe(
      map(a => a.body as any as string),
      catchError(e => of(null))
    );
  }

}
